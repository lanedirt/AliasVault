package net.aliasvault.app.vaultstore

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteException
import android.database.sqlite.SQLiteOpenHelper
import android.util.Base64
import android.util.Log
import net.aliasvault.app.credentialmanager.SharedCredentialStore
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPInputStream
import java.util.zip.GZIPOutputStream
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import java.security.SecureRandom
import java.io.File
import net.aliasvault.app.vaultstore.storageprovider.StorageProvider
class VaultStore(private val storageProvider: StorageProvider) {
    private var dbConnection: SQLiteDatabase? = null
    private val TAG = "VaultStore"
    private var isVaultUnlocked = false
    private var autoLockTimeout: Long = 300000 // 5 minutes default
    private var lastUnlockTime: Long = 0
    private var encryptionKey: ByteArray? = null

    fun initializeWithEncryptedData(encryptedData: String, base64EncryptionKey: String) {
        try {
            // Decode the encryption key
            this.encryptionKey = Base64.decode(base64EncryptionKey, Base64.DEFAULT)

            // Decrypt the data using the encryption key
            val decryptedData = decryptData(encryptedData)

            // Decompress the data if it's compressed
            val decompressedData = decompressData(decryptedData)

            // Create an in-memory SQLite database
            dbConnection = SQLiteDatabase.create(null)

            // Import the SQL statements from the decrypted data
            val statements = decompressedData.split(";")
            for (statement in statements) {
                if (statement.trim().isNotEmpty()) {
                    dbConnection?.execSQL(statement)
                }
            }

            isVaultUnlocked = true
            lastUnlockTime = System.currentTimeMillis()
            Log.d(TAG, "Database initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing database", e)
            throw e
        }
    }

    fun storeEncryptionKey(base64EncryptionKey: String) {
        this.encryptionKey = Base64.decode(base64EncryptionKey, Base64.DEFAULT)
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

    fun storeMetadata(metadata: String) {
        // Write the metadata to the filesystem via the supplied file provider
        // which can either be the real Android file system or a fake file system for testing
        storageProvider.setMetadata(metadata)
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
            val cursor = db.rawQuery(query, params.map { it?.toString() }.toTypedArray())

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
            db.execSQL(query, params.map { it?.toString() }.toTypedArray())
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
    }

    fun rollbackTransaction() {
        dbConnection?.endTransaction()
    }

    fun isVaultUnlocked(): Boolean {
        if (isVaultUnlocked && System.currentTimeMillis() - lastUnlockTime > autoLockTimeout) {
            isVaultUnlocked = false
        }
        return isVaultUnlocked
    }

    fun setAutoLockTimeout(timeout: Long) {
        autoLockTimeout = timeout
    }

    fun getAutoLockTimeout(): Long {
        return autoLockTimeout
    }

    fun clearVault() {
        dbConnection?.close()
        dbConnection = null
        isVaultUnlocked = false
        encryptionKey = null
    }

    private fun decryptData(encryptedData: String): String {
        if (encryptionKey == null) {
            throw IllegalStateException("Encryption key not set")
        }

        try {
            val decoded = Base64.decode(encryptedData, Base64.DEFAULT)

            // Extract IV from the first 12 bytes
            val iv = decoded.copyOfRange(0, 12)
            val encryptedContent = decoded.copyOfRange(12, decoded.size)

            // Create cipher
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val keySpec = SecretKeySpec(encryptionKey, "AES")
            val gcmSpec = GCMParameterSpec(128, iv)

            // Initialize cipher for decryption
            cipher.init(Cipher.DECRYPT_MODE, keySpec, gcmSpec)

            // Decrypt
            val decrypted = cipher.doFinal(encryptedContent)
            return String(decrypted, Charsets.UTF_8)
        } catch (e: Exception) {
            Log.e(TAG, "Error decrypting data", e)
            throw e
        }
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

            return Base64.encodeToString(result, Base64.DEFAULT)
        } catch (e: Exception) {
            Log.e(TAG, "Error encrypting data", e)
            throw e
        }
    }

    private fun decompressData(compressedData: String): String {
        val decoded = Base64.decode(compressedData, Base64.DEFAULT)
        val inputStream = GZIPInputStream(ByteArrayInputStream(decoded))
        val outputStream = ByteArrayOutputStream()

        val buffer = ByteArray(1024)
        var len: Int
        while (inputStream.read(buffer).also { len = it } > 0) {
            outputStream.write(buffer, 0, len)
        }

        return outputStream.toString("UTF-8")
    }

    private fun compressData(data: String): String {
        val outputStream = ByteArrayOutputStream()
        val gzipOutputStream = GZIPOutputStream(outputStream)
        gzipOutputStream.write(data.toByteArray(Charsets.UTF_8))
        gzipOutputStream.close()
        return Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)
    }

    private fun setupDatabaseWithDecryptedData(decryptedDbBase64: String) {
        var tempDbFile: File? = null
        try {
            // Decode the base64 data
            val decryptedDbData = Base64.decode(decryptedDbBase64, Base64.DEFAULT)

            // Create a temporary file to store the decrypted database
            tempDbFile = File.createTempFile("temp_db", ".sqlite")
            tempDbFile.writeBytes(decryptedDbData)

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

                if (verifyCursor == null || !verifyCursor.moveToFirst()) {
                    throw SQLiteException("Failed to attach source database or no tables found")
                }

                verifyCursor.use {
                    while (it.moveToNext()) {
                        val tableName = it.getString(0)
                        // Create table and copy data using rawQuery
                        dbConnection?.rawQuery("CREATE TABLE $tableName AS SELECT * FROM source.$tableName", null)
                    }
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

            isVaultUnlocked = true
            lastUnlockTime = System.currentTimeMillis()

        } catch (e: Exception) {
            Log.e(TAG, "Error setting up database with decrypted data", e)
            throw e
        } finally {
            // Clean up temporary file
            tempDbFile?.delete()
        }
    }

    companion object {
        private const val DATABASE_NAME = "vault.db"
        private const val DATABASE_VERSION = 1
    }
}
