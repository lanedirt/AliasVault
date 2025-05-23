package net.aliasvault.app.vaultstore

import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteException
import android.util.Base64
import android.util.Log
import net.aliasvault.app.vaultstore.models.*
import org.json.JSONObject
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import java.security.SecureRandom
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import net.aliasvault.app.vaultstore.storageprovider.StorageProvider
import org.json.JSONArray
import net.aliasvault.app.vaultstore.keystoreprovider.KeystoreProvider
import net.aliasvault.app.vaultstore.keystoreprovider.KeystoreOperationCallback
import android.os.Handler
import android.os.Looper

class VaultStore(
    private val storageProvider: StorageProvider,
    private val keystoreProvider: KeystoreProvider,
) {
    private val TAG = "VaultStore"
    private val BIOMETRICS_AUTH_METHOD = "faceid"

    private var encryptionKey: ByteArray? = null
    private var dbConnection: SQLiteDatabase? = null
    private var lastUnlockTime: Long = 0
    private var autoLockHandler: Handler? = null
    private var autoLockRunnable: Runnable? = null

    init {
        // Initialize the handler on the main thread
        autoLockHandler = Handler(Looper.getMainLooper())
    }

    // Interface for operations that need callbacks
    interface CryptoOperationCallback {
        fun onSuccess(result: String)
        fun onError(e: Exception)
    }

    fun storeEncryptionKey(base64EncryptionKey: String) {
        this.encryptionKey = Base64.decode(base64EncryptionKey, Base64.NO_WRAP)

        // Check if biometric auth is enabled in auth methods
        val authMethods = getAuthMethods()
        if (authMethods.contains(BIOMETRICS_AUTH_METHOD) && keystoreProvider.isBiometricAvailable()) {
            // Create a latch to wait for the callback
            val latch = java.util.concurrent.CountDownLatch(1)
            var error: Exception? = null

            keystoreProvider.storeKey(
                key = base64EncryptionKey,
                object : KeystoreOperationCallback {
                    override fun onSuccess(result: String) {
                        Log.d(TAG, "Encryption key stored successfully with biometric protection")
                        latch.countDown()
                    }

                    override fun onError(e: Exception) {
                        Log.e(TAG, "Error storing encryption key with biometric protection", e)
                        error = e
                        latch.countDown()
                    }
                }
            )

            // Wait for the callback to complete
            latch.await()

            // Throw any error that occurred
            error?.let { throw it }
        }
    }

    fun getEncryptionKey(callback: CryptoOperationCallback) {
        // If key is already in memory, use it
        encryptionKey?.let {
            Log.d(TAG, "Using cached encryption key")
            callback.onSuccess(Base64.encodeToString(it, Base64.NO_WRAP))
            return
        }

        // Check if biometric auth is enabled in auth methods
        val authMethods = getAuthMethods()
        if (authMethods.contains(BIOMETRICS_AUTH_METHOD) && keystoreProvider.isBiometricAvailable()) {
            keystoreProvider.retrieveKey(
                object : KeystoreOperationCallback {
                    override fun onSuccess(result: String) {
                        try {
                            // Cache the key
                            encryptionKey = Base64.decode(result, Base64.NO_WRAP)
                            callback.onSuccess(result)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error decoding retrieved key", e)
                            callback.onError(e)
                        }
                    }

                    override fun onError(e: Exception) {
                        Log.e(TAG, "Error retrieving key", e)
                        callback.onError(e)
                    }
                }
            )
        } else {
            callback.onError(Exception("No encryption key found"))
        }
    }

    fun storeEncryptionKeyDerivationParams(keyDerivationParams: String) {
        this.storageProvider.setKeyDerivationParams(keyDerivationParams)
    }

    fun getEncryptionKeyDerivationParams(): String {
        return this.storageProvider.getKeyDerivationParams()
    }

    fun storeEncryptedDatabase(encryptedData: String) {
        // Write the encrypted blob to the filesystem via the supplied file provider
        // which can either be the real Android file system or a fake file system for testing
        storageProvider.setEncryptedDatabaseFile(encryptedData)
    }

    /**
     * Get the encrypted database from the storage provider
     * @return The encrypted database as a base64 encoded string
     */
    fun getEncryptedDatabase() : String {
        val encryptedDbBase64 = storageProvider.getEncryptedDatabaseFile().readText()
        return encryptedDbBase64
    }

    /**
     * Check if the encrypted database exists in the storage provider
     * @return True if the encrypted database exists, false otherwise
     */
    fun hasEncryptedDatabase() : Boolean {
        return storageProvider.getEncryptedDatabaseFile().exists()
    }

    /**
     * Store the metadata in the storage provider
     * @param metadata The metadata to store
     */
    fun storeMetadata(metadata: String) {
        storageProvider.setMetadata(metadata)
    }

    /**
     * Get the metadata from the storage provider
     * @return The metadata as a string
     */
    fun getMetadata() : String {
        return storageProvider.getMetadata()
    }

    fun unlockVault() {
        val encryptedDbBase64 = getEncryptedDatabase()
        val decryptedDbBase64 = decryptData(encryptedDbBase64)

        try {
            setupDatabaseWithDecryptedData(decryptedDbBase64)
        } catch (e: Exception) {
            Log.e(TAG, "Error unlocking vault", e)
            throw e
        }
    }

    fun executeQuery(query: String, params: Array<Any?>): List<Map<String, Any?>> {
        val results = mutableListOf<Map<String, Any?>>()

        dbConnection?.let { db ->
            // Convert any base64 strings with the special flag to blobs
            val convertedParams = params.map { param ->
                if (param is String && param.startsWith("av-base64-to-blob:")) {
                    val base64 = param.substring("av-base64-to-blob:".length)
                    Base64.decode(base64, Base64.NO_WRAP)
                } else {
                    param
                }
            }.toTypedArray()

            val cursor = db.rawQuery(query, convertedParams.map { it?.toString() }.toTypedArray())

            cursor.use {
                val columnNames = it.columnNames
                while (it.moveToNext()) {
                    val row = mutableMapOf<String, Any?>()
                    for (columnName in columnNames) {
                        when (it.getType(it.getColumnIndexOrThrow(columnName))) {
                            android.database.Cursor.FIELD_TYPE_NULL -> row[columnName] = null
                            android.database.Cursor.FIELD_TYPE_INTEGER -> row[columnName] = it.getLong(it.getColumnIndexOrThrow(columnName))
                            android.database.Cursor.FIELD_TYPE_FLOAT -> row[columnName] = it.getDouble(it.getColumnIndexOrThrow(columnName))
                            android.database.Cursor.FIELD_TYPE_STRING -> row[columnName] = it.getString(it.getColumnIndexOrThrow(columnName))
                            android.database.Cursor.FIELD_TYPE_BLOB -> row[columnName] = it.getBlob(it.getColumnIndexOrThrow(columnName))
                        }
                    }
                    results.add(row)
                }
            }
        }

        return results
    }

    fun executeUpdate(query: String, params: Array<Any?>): Int {
        dbConnection?.let { db ->
            // Convert any base64 strings with the special flag to blobs
            val convertedParams = params.map { param ->
                if (param is String && param.startsWith("av-base64-to-blob:")) {
                    val base64 = param.substring("av-base64-to-blob:".length)
                    Base64.decode(base64, Base64.NO_WRAP)
                } else {
                    param
                }
            }.toTypedArray()

            db.execSQL(query, convertedParams)
            // Get the number of affected rows
            val cursor = db.rawQuery("SELECT changes()", null)
            cursor.use {
                if (it.moveToFirst()) {
                    return it.getInt(0)
                }
            }
        }
        return 0
    }

    fun beginTransaction() {
        dbConnection?.beginTransaction()
    }

    fun commitTransaction() {
        dbConnection?.setTransactionSuccessful()
        dbConnection?.endTransaction()

        // Create a temporary file to store the database
        val tempDbFile = File.createTempFile("temp_db", ".sqlite")
        tempDbFile.writeBytes(ByteArray(0)) // Initialize empty file

        try {
            // Attach the temporary file as target database
            dbConnection?.execSQL("ATTACH DATABASE '${tempDbFile.path}' AS target")

            // Begin transaction for copying data
            dbConnection?.beginTransaction()

            try {
                // Get all table names from the main database
                val cursor = dbConnection?.rawQuery(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%'",
                    null
                )

                cursor?.use {
                    while (it.moveToNext()) {
                        val tableName = it.getString(0)
                        // Create table and copy data
                        dbConnection?.execSQL("CREATE TABLE target.$tableName AS SELECT * FROM main.$tableName")
                    }
                }

                // Commit the copy transaction
                dbConnection?.setTransactionSuccessful()
            } catch (e: Exception) {
                // If anything fails, rollback the transaction
                throw e
            } finally {
                dbConnection?.endTransaction()
            }

            // Detach the target database
            dbConnection?.execSQL("DETACH DATABASE target")

            // Read the temporary database file
            val rawData = tempDbFile.readBytes()

            // Convert to base64 and encrypt
            val base64String = Base64.encodeToString(rawData, Base64.NO_WRAP)
            val encryptedBase64Data = encryptData(base64String)

            // Store the encrypted database
            storeEncryptedDatabase(encryptedBase64Data)
        } catch (e: Exception) {
            Log.e(TAG, "Error exporting and encrypting database", e)
            throw e
        }
        finally {
            // Remove the temporary file
            tempDbFile.delete()
        }
    }

    fun rollbackTransaction() {
        dbConnection?.endTransaction()
    }

    fun isVaultUnlocked(): Boolean {
        if (encryptionKey == null) {
            return false
        }

        return true
    }

    fun setAutoLockTimeout(timeout: Int) {
        storageProvider.setAutoLockTimeout(timeout)
    }

    fun getAutoLockTimeout(): Int {
        return storageProvider.getAutoLockTimeout()
    }

    fun setAuthMethods(authMethods: String) {
        storageProvider.setAuthMethods(authMethods)

        // If the new auth methods no longer include biometrics, clear the biometric key.
        if (!authMethods.contains(BIOMETRICS_AUTH_METHOD)) {
            keystoreProvider.clearKeys()
        }
    }

    fun getAuthMethods(): String {
        return storageProvider.getAuthMethods()
    }

    fun setVaultRevisionNumber(revisionNumber: Int) {
        val metadata = getVaultMetadataObject() ?: VaultMetadata()
        val updatedMetadata = metadata.copy(vaultRevisionNumber = revisionNumber)
        storeMetadata(JSONObject().apply {
            put("publicEmailDomains", JSONArray(updatedMetadata.publicEmailDomains))
            put("privateEmailDomains", JSONArray(updatedMetadata.privateEmailDomains))
            put("vaultRevisionNumber", updatedMetadata.vaultRevisionNumber)
        }.toString())
    }

    fun getVaultRevisionNumber(): Int {
        return getVaultMetadataObject()?.vaultRevisionNumber ?: 0
    }

    private fun getVaultMetadataObject(): VaultMetadata? {
        val metadataJson = getMetadata()
        if (metadataJson.isBlank()) {
            return null
        }
        return try {
            val json = JSONObject(metadataJson)
            VaultMetadata(
                publicEmailDomains = json.optJSONArray("publicEmailDomains")?.let { array ->
                    List(array.length()) { i -> array.getString(i) }
                } ?: emptyList(),
                privateEmailDomains = json.optJSONArray("privateEmailDomains")?.let { array ->
                    List(array.length()) { i -> array.getString(i) }
                } ?: emptyList(),
                vaultRevisionNumber = json.optInt("vaultRevisionNumber", 0)
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing vault metadata", e)
            null
        }
    }

    /**
     * Clear the memory - remove the encryption key and decrypted database from memory
     */
    fun clearCache() {
        Log.d(TAG, "Clearing cache - removing encryption key and decrypted database from memory")
        dbConnection?.close()
        encryptionKey = null
        dbConnection = null
    }

    fun clearVault() {
        // Remove cached data from memory
        clearCache()

        // Remove the encryption key stored in the keystore
        keystoreProvider.clearKeys()

        // Remove all data from the storage provider
        storageProvider.clearStorage()
    }

    private fun decryptData(encryptedData: String): String {
        var decryptedResult: String? = null
        var error: Exception? = null

        // Create a latch to wait for the callback
        val latch = java.util.concurrent.CountDownLatch(1)

        getEncryptionKey(object : CryptoOperationCallback {
            override fun onSuccess(result: String) {
                try {
                    val decoded = Base64.decode(encryptedData, Base64.NO_WRAP)

                    // Extract IV from the first 12 bytes
                    val iv = decoded.copyOfRange(0, 12)
                    val encryptedContent = decoded.copyOfRange(12, decoded.size)

                    // Create cipher
                    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
                    val keySpec = SecretKeySpec(encryptionKey!!, "AES")
                    val gcmSpec = GCMParameterSpec(128, iv)

                    // Initialize cipher for decryption
                    cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec)

                    // Decrypt
                    val decrypted = cipher.doFinal(encryptedContent)
                    decryptedResult = String(decrypted, Charsets.UTF_8)
                } catch (e: Exception) {
                    error = e
                    Log.e(TAG, "Error decrypting data", e)
                } finally {
                    latch.countDown()
                }
            }

            override fun onError(e: Exception) {
                error = e
                Log.e(TAG, "Error getting encryption key", e)
                latch.countDown()
            }
        })

        // Wait for the callback to complete
        latch.await()

        // Throw any error that occurred or return the result
        error?.let { throw it }
        return decryptedResult ?: throw IllegalStateException("Decryption failed")
    }

    private fun encryptData(data: String): String {
        try {
            // Generate random IV
            val iv = ByteArray(12)
            SecureRandom().nextBytes(iv)

            // Create cipher
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val keySpec = SecretKeySpec(encryptionKey!!, "AES")
            val gcmSpec = GCMParameterSpec(128, iv)

            // Initialize cipher for encryption
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, gcmSpec)

            // Encrypt
            val encrypted = cipher.doFinal(data.toByteArray(Charsets.UTF_8))

            // Combine IV and encrypted content
            val result = ByteArray(iv.size + encrypted.size)
            System.arraycopy(iv, 0, result, 0, iv.size)
            System.arraycopy(encrypted, 0, result, iv.size, encrypted.size)

            return Base64.encodeToString(result, Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(TAG, "Error encrypting data", e)
            throw e
        }
    }

    private fun setupDatabaseWithDecryptedData(decryptedDbBase64: String) {
        var tempDbFile: File? = null
        try {
            // Decode the base64 data
            val decryptedDbData = Base64.decode(decryptedDbBase64, Base64.NO_WRAP)

            // Create a temporary file to store the decrypted database
            tempDbFile = File.createTempFile("temp_db", ".sqlite")
            tempDbFile.writeBytes(decryptedDbData)

            // Close any existing connection if it exists
            dbConnection?.close()

            // Create an in-memory database
            dbConnection = SQLiteDatabase.create(null)

            // Begin transaction
            dbConnection?.beginTransaction()

            try {
                // Attach the temporary database
                val attachQuery = "ATTACH DATABASE '${tempDbFile.path}' AS source"
                dbConnection?.execSQL(attachQuery)

                // Verify the attachment worked by checking if we can access the source database
                val verifyCursor = dbConnection?.rawQuery(
                    "SELECT name FROM source.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
                    null
                )

                if (verifyCursor == null) {
                    throw SQLiteException("Failed to attach source database")
                }

                verifyCursor.use {
                    if (!it.moveToFirst()) {
                        throw SQLiteException("No tables found in source database")
                    }

                    do {
                        val tableName = it.getString(0)
                        // Create table and copy data using rawQuery
                        dbConnection?.execSQL("CREATE TABLE $tableName AS SELECT * FROM source.$tableName")
                    } while (it.moveToNext())
                }

                // Commit transaction
                dbConnection?.setTransactionSuccessful()
            } finally {
                dbConnection?.endTransaction()
            }

            // Detach the source database
            dbConnection?.rawQuery("DETACH DATABASE source", null)

            // Set database pragmas using rawQuery
            dbConnection?.rawQuery("PRAGMA journal_mode = WAL", null)
            dbConnection?.rawQuery("PRAGMA synchronous = NORMAL", null)
            dbConnection?.rawQuery("PRAGMA foreign_keys = ON", null)

            lastUnlockTime = System.currentTimeMillis()

        } catch (e: Exception) {
            Log.e(TAG, "Error setting up database with decrypted data", e)
            throw e
        } finally {
            // Clean up temporary file
            tempDbFile?.delete()
        }
    }

    fun getAllCredentials(): List<Credential> {
        if (dbConnection == null) {
            throw IllegalStateException("Database not initialized")
        }

        Log.d(TAG, "Executing get all credentials query..")

        val query = """
            WITH LatestPasswords AS (
                SELECT
                    p.Id as password_id,
                    p.CredentialId,
                    p.Value,
                    p.CreatedAt,
                    p.UpdatedAt,
                    p.IsDeleted,
                    ROW_NUMBER() OVER (PARTITION BY p.CredentialId ORDER BY p.CreatedAt DESC) as rn
                FROM Passwords p
                WHERE p.IsDeleted = 0
            )
            SELECT
                c.Id,
                c.AliasId,
                c.Username,
                c.Notes,
                c.CreatedAt,
                c.UpdatedAt,
                c.IsDeleted,
                s.Id as service_id,
                s.Name as service_name,
                s.Url as service_url,
                s.Logo as service_logo,
                s.CreatedAt as service_created_at,
                s.UpdatedAt as service_updated_at,
                s.IsDeleted as service_is_deleted,
                lp.password_id,
                lp.Value as password_value,
                lp.CreatedAt as password_created_at,
                lp.UpdatedAt as password_updated_at,
                lp.IsDeleted as password_is_deleted,
                a.Id as alias_id,
                a.Gender as alias_gender,
                a.FirstName as alias_first_name,
                a.LastName as alias_last_name,
                a.NickName as alias_nick_name,
                a.BirthDate as alias_birth_date,
                a.Email as alias_email,
                a.CreatedAt as alias_created_at,
                a.UpdatedAt as alias_updated_at,
                a.IsDeleted as alias_is_deleted
            FROM Credentials c
            LEFT JOIN Services s ON s.Id = c.ServiceId AND s.IsDeleted = 0
            LEFT JOIN LatestPasswords lp ON lp.CredentialId = c.Id AND lp.rn = 1
            LEFT JOIN Aliases a ON a.Id = c.AliasId AND a.IsDeleted = 0
            WHERE c.IsDeleted = 0
            ORDER BY c.CreatedAt DESC
        """

        val result = mutableListOf<Credential>()
        val cursor = dbConnection?.rawQuery(query, null)

        cursor?.use {
            while (it.moveToNext()) {
                try {
                    val id = UUID.fromString(it.getString(0))
                    val isDeleted = it.getInt(6) == 1

                    // Service
                    val serviceId = UUID.fromString(it.getString(7))
                    val service = Service(
                        id = serviceId,
                        name = it.getString(8),
                        url = it.getString(9),
                        logo = it.getBlob(10),
                        createdAt = parseDateString(it.getString(11)) ?: MIN_DATE,
                        updatedAt = parseDateString(it.getString(12)) ?: MIN_DATE,
                        isDeleted = it.getInt(13) == 1
                    )

                    // Password
                    var password: Password? = null
                    if (!it.isNull(14)) {
                        password = Password(
                            id = UUID.fromString(it.getString(14)),
                            credentialId = id,
                            value = it.getString(15),
                            createdAt = parseDateString(it.getString(16)) ?: MIN_DATE,
                            updatedAt = parseDateString(it.getString(17)) ?: MIN_DATE,
                            isDeleted = it.getInt(18) == 1
                        )
                    }

                    // Alias
                    var alias: Alias? = null
                    if (!it.isNull(19)) {
                        alias = Alias(
                            id = UUID.fromString(it.getString(19)),
                            gender = it.getString(20),
                            firstName = it.getString(21),
                            lastName = it.getString(22),
                            nickName = it.getString(23),
                            birthDate = parseDateString(it.getString(24)) ?: MIN_DATE,
                            email = it.getString(25),
                            createdAt = parseDateString(it.getString(26)) ?: MIN_DATE,
                            updatedAt = parseDateString(it.getString(27)) ?: MIN_DATE,
                            isDeleted = it.getInt(28) == 1
                        )
                    }

                    val credential = Credential(
                        id = id,
                        alias = alias,
                        service = service,
                        username = it.getString(2),
                        notes = it.getString(3),
                        password = password,
                        createdAt = parseDateString(it.getString(4)) ?: MIN_DATE,
                        updatedAt = parseDateString(it.getString(5)) ?: MIN_DATE,
                        isDeleted = isDeleted
                    )
                    result.add(credential)
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing credential row", e)
                }
            }
        }

        Log.d(TAG, "Found ${result.size} credentials")
        return result
    }

    /**
     * Parse a date string from the database into a Date object
     *
     * @param dateString The date string to parse
     * @return The parsed Date object or null if the date string is null or cannot be parsed
     */
    private fun parseDateString(dateString: String?): Date? {
        if (dateString == null) {
            return null
        }

        return try {
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.parse(dateString)
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing date: $dateString", e)
            null
        }
    }

    fun onAppBackgrounded() {
        Log.d(TAG, "App entered background, starting auto-lock timer with ${getAutoLockTimeout()}s")
        if (getAutoLockTimeout() > 0) {
            // Cancel any existing auto-lock timer
            autoLockRunnable?.let { autoLockHandler?.removeCallbacks(it) }

            // Create and schedule new auto-lock timer
            autoLockRunnable = Runnable {
                Log.d(TAG, "Auto-lock timer fired, clearing cache")
                clearCache()
            }
            autoLockHandler?.postDelayed(autoLockRunnable!!, getAutoLockTimeout().toLong() * 1000)
        }
    }

    fun onAppForegrounded() {
        Log.d(TAG, "App entered foreground, canceling auto-lock timer")
        // Cancel the auto-lock timer
        autoLockRunnable?.let { autoLockHandler?.removeCallbacks(it) }
        autoLockRunnable = null
    }

    companion object {
        private val MIN_DATE: Date = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
            set(Calendar.YEAR, 1)
            set(Calendar.MONTH, Calendar.JANUARY)
            set(Calendar.DAY_OF_MONTH, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.time
    }
}
