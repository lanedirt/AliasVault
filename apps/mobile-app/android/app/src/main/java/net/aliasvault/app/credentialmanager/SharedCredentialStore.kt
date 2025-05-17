package net.aliasvault.app.credentialmanager

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.Log
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.fragment.app.FragmentActivity
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.nio.ByteBuffer
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import java.security.SecureRandom
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

class SharedCredentialStore private constructor(context: Context) {
    private val appContext = context.applicationContext
    private val executor: Executor = Executors.newSingleThreadExecutor()
    private val biometricManager = BiometricManager.from(appContext)

    // Cache for encryption key during the lifetime of this instance
    private var encryptionKey: ByteArray? = null

    // Interface for operations that need callbacks
    interface CryptoOperationCallback {
        fun onSuccess(result: String)
        fun onError(e: Exception)
    }

    /**
     * Check if biometric authentication is available on the device
     */
    private fun isBiometricAvailable(): Boolean {
        return biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) ==
            BiometricManager.BIOMETRIC_SUCCESS
    }

    /**
     * Get or create encryption key using biometric authentication if available
     */
    fun getEncryptionKey(activity: FragmentActivity, callback: CryptoOperationCallback) {
        // If key is already in memory, use it
        encryptionKey?.let {
            Log.d(TAG, "Using cached encryption key")
            callback.onSuccess("Key available")
            return
        }

        // Check if we have a stored key
        val prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
        val encryptedKeyB64 = prefs.getString(ENCRYPTED_KEY_PREF, null)

        if (encryptedKeyB64 == null) {
            // No key exists, create a new one
            if (isBiometricAvailable()) {
                createNewEncryptionKey(activity, callback)
            } else {
                // Create key without biometric protection
                createNewEncryptionKeyWithoutBiometric(callback)
            }
        } else {
            // Key exists, retrieve it
            if (isBiometricAvailable()) {
                retrieveEncryptionKey(activity, encryptedKeyB64, callback)
            } else {
                // Retrieve key without biometric protection
                retrieveEncryptionKeyWithoutBiometric(encryptedKeyB64, callback)
            }
        }
    }

    /**
     * Create a new random encryption key without biometric protection
     */
    private fun createNewEncryptionKeyWithoutBiometric(callback: CryptoOperationCallback) {
        try {
            // Generate a random 32-byte key for AES-256
            val secureRandom = SecureRandom()
            val randomKey = ByteArray(32)
            secureRandom.nextBytes(randomKey)

            // Cache the key
            encryptionKey = randomKey

            // Store the key directly
            val prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
            val encryptedKeyB64 = Base64.encodeToString(randomKey, Base64.DEFAULT)
            prefs.edit().putString(ENCRYPTED_KEY_PREF, encryptedKeyB64).apply()

            Log.d(TAG, "Encryption key stored successfully without biometric protection")
            callback.onSuccess("Key stored successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error creating encryption key", e)
            callback.onError(e)
        }
    }

    /**
     * Retrieve the encryption key without biometric authentication
     */
    private fun retrieveEncryptionKeyWithoutBiometric(
        encryptedKeyB64: String,
        callback: CryptoOperationCallback
    ) {
        try {
            // Decode the key
            val key = Base64.decode(encryptedKeyB64, Base64.DEFAULT)

            // Cache the key
            encryptionKey = key

            Log.d(TAG, "Encryption key retrieved successfully without biometric protection")
            callback.onSuccess("Key retrieved successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error retrieving encryption key", e)
            callback.onError(e)
        }
    }

    /**
     * Create a new random encryption key and protect it with biometrics
     */
    private fun createNewEncryptionKey(activity: FragmentActivity, callback: CryptoOperationCallback) {
        try {
            // Generate a random 32-byte key for AES-256
            val secureRandom = SecureRandom()
            val randomKey = ByteArray(32)
            secureRandom.nextBytes(randomKey)

            // Cache the key
            encryptionKey = randomKey

            // Store the key protected by biometric authentication
            storeKeyWithBiometricProtection(activity, randomKey, callback)
        } catch (e: Exception) {
            Log.e(TAG, "Error creating encryption key", e)
            callback.onError(e)
        }
    }

    /**
     * Store the encryption key protected by biometric authentication
     */
    private fun storeKeyWithBiometricProtection(
        activity: FragmentActivity,
        keyToStore: ByteArray,
        callback: CryptoOperationCallback
    ) {
        try {
            // Set up KeyStore
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)

            // Create or get biometric key
            if (!keyStore.containsAlias(KEYSTORE_ALIAS)) {
                val keyGenerator = KeyGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore"
                )

                val keySpec = KeyGenParameterSpec.Builder(
                    KEYSTORE_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setUserAuthenticationRequired(true)
                    .build()

                keyGenerator.init(keySpec)
                keyGenerator.generateKey()
            }

            // Get the created key
            val secretKey = keyStore.getKey(KEYSTORE_ALIAS, null) as SecretKey

            // Create BiometricPrompt
            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle("Remember AliasVault password")
                .setSubtitle("Protect your AliasVault decryption key with your biometrics.")
                .setNegativeButtonText("Cancel")
                .build()

            val biometricPrompt = BiometricPrompt(activity, executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        try {
                            // Get the cipher from the result
                            val cipher = result.cryptoObject?.cipher ?: throw Exception("Cipher is null")

                            // Encrypt the key
                            val encryptedKey = cipher.doFinal(keyToStore)
                            val iv = cipher.iv

                            // Combine IV and encrypted key
                            val byteBuffer = ByteBuffer.allocate(iv.size + encryptedKey.size)
                            byteBuffer.put(iv)
                            byteBuffer.put(encryptedKey)
                            val combined = byteBuffer.array()

                            // Store encrypted key in SharedPreferences
                            val encryptedKeyB64 = Base64.encodeToString(combined, Base64.DEFAULT)
                            val prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
                            prefs.edit().putString(ENCRYPTED_KEY_PREF, encryptedKeyB64).apply()

                            Log.d(TAG, "Encryption key stored successfully")
                            callback.onSuccess("Key stored successfully")
                        } catch (e: Exception) {
                            Log.e(TAG, "Error storing encryption key", e)
                            callback.onError(e)
                        }
                    }

                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        Log.e(TAG, "Authentication error: $errString")
                        callback.onError(Exception("Authentication error: $errString"))
                    }

                    override fun onAuthenticationFailed() {
                        Log.e(TAG, "Authentication failed")
                    }
                })

            // Initialize cipher for encryption
            val cipher = Cipher.getInstance(
                "${KeyProperties.KEY_ALGORITHM_AES}/" +
                "${KeyProperties.BLOCK_MODE_GCM}/" +
                KeyProperties.ENCRYPTION_PADDING_NONE
            )
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)

            // Show biometric prompt
            biometricPrompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))

        } catch (e: Exception) {
            Log.e(TAG, "Error in biometric key storage", e)
            callback.onError(e)
        }
    }

    /**
     * Retrieve the encryption key using biometric authentication
     */
    private fun retrieveEncryptionKey(
        activity: FragmentActivity,
        encryptedKeyB64: String,
        callback: CryptoOperationCallback
    ) {
        try {
            // Set up KeyStore
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)

            // Check if key exists
            if (!keyStore.containsAlias(KEYSTORE_ALIAS)) {
                Log.e(TAG, "Keystore key not found")
                createNewEncryptionKey(activity, callback)
                return
            }

            // Get the key
            val secretKey = keyStore.getKey(KEYSTORE_ALIAS, null) as SecretKey

            // Create BiometricPrompt
            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle("Unlock Vault")
                .setSubtitle("Unlock your protected AliasVault contents")
                .setNegativeButtonText("Cancel")
                .build()

            val biometricPrompt = BiometricPrompt(activity, executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        try {
                            // Get the cipher from the result
                            val cipher = result.cryptoObject?.cipher ?: throw Exception("Cipher is null")

                            // Decode combined data
                            val combined = Base64.decode(encryptedKeyB64, Base64.DEFAULT)

                            // Extract IV and encrypted data
                            val byteBuffer = ByteBuffer.wrap(combined)

                            // GCM typically uses 12 bytes for IV
                            val iv = ByteArray(12)
                            byteBuffer.get(iv)

                            // Get remaining bytes as ciphertext
                            val encryptedBytes = ByteArray(byteBuffer.remaining())
                            byteBuffer.get(encryptedBytes)

                            // Decrypt the key
                            val decryptedKey = cipher.doFinal(encryptedBytes)

                            // Cache the key
                            encryptionKey = decryptedKey

                            Log.d(TAG, "Encryption key retrieved successfully")
                            callback.onSuccess("Key retrieved successfully")
                        } catch (e: Exception) {
                            Log.e(TAG, "Error retrieving encryption key", e)
                            callback.onError(e)
                        }
                    }

                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        Log.e(TAG, "Authentication error: $errString")
                        callback.onError(Exception("Authentication error: $errString"))
                    }

                    override fun onAuthenticationFailed() {
                        Log.e(TAG, "Authentication failed")
                    }
                })

            // Initialize cipher for decryption with IV from stored encrypted key
            val combined = Base64.decode(encryptedKeyB64, Base64.DEFAULT)
            val byteBuffer = ByteBuffer.wrap(combined)
            val iv = ByteArray(12)
            byteBuffer.get(iv)

            val cipher = Cipher.getInstance(
                "${KeyProperties.KEY_ALGORITHM_AES}/" +
                "${KeyProperties.BLOCK_MODE_GCM}/" +
                KeyProperties.ENCRYPTION_PADDING_NONE
            )
            val spec = GCMParameterSpec(128, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)

            // Show biometric prompt
            biometricPrompt.authenticate(promptInfo, BiometricPrompt.CryptoObject(cipher))

        } catch (e: Exception) {
            Log.e(TAG, "Error in biometric key retrieval", e)
            callback.onError(e)
        }
    }

    /**
     * Encrypts data using AES/GCM/NoPadding
     */
    @Throws(Exception::class)
    private fun encryptData(plaintext: String): String {
        val key = encryptionKey ?: throw Exception("Encryption key not available")

        // Create cipher
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")

        // Create secret key from retrieved bytes
        val secretKeySpec = SecretKeySpec(key, "AES")

        // Initialize cipher for encryption
        cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec)

        // Get IV
        val iv = cipher.iv

        // Encrypt data
        val encryptedBytes = cipher.doFinal(plaintext.toByteArray(StandardCharsets.UTF_8))

        // Combine IV and encrypted data
        val byteBuffer = ByteBuffer.allocate(iv.size + encryptedBytes.size)
        byteBuffer.put(iv)
        byteBuffer.put(encryptedBytes)
        val combined = byteBuffer.array()

        // Return Base64 encoded combined data
        return Base64.encodeToString(combined, Base64.DEFAULT)
    }

    /**
     * Decrypts data using AES/GCM/NoPadding
     */
    @Throws(Exception::class)
    public fun decryptData(encryptedData: String): String {
        val key = encryptionKey ?: throw Exception("Encryption key not available")

        // Decode combined data
        val combined = Base64.decode(encryptedData, Base64.DEFAULT)

        // Extract IV and encrypted data
        val byteBuffer = ByteBuffer.wrap(combined)

        // GCM typically uses 12 bytes for IV
        val iv = ByteArray(12)
        byteBuffer.get(iv)

        // Get remaining bytes as ciphertext
        val encryptedBytes = ByteArray(byteBuffer.remaining())
        byteBuffer.get(encryptedBytes)

        // Create cipher
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")

        // Create secret key from retrieved bytes
        val secretKeySpec = SecretKeySpec(key, "AES")

        // Create GCM parameter spec with IV
        val gcmParameterSpec = GCMParameterSpec(128, iv)

        // Initialize cipher for decryption
        cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, gcmParameterSpec)

        // Decrypt data
        val decryptedBytes = cipher.doFinal(encryptedBytes)

        // Return decrypted string
        return String(decryptedBytes, StandardCharsets.UTF_8)
    }

    /**
     * Save a credential to SharedPreferences with encryption
     */
    fun saveCredential(
        activity: FragmentActivity,
        credential: Credential,
        callback: CryptoOperationCallback
    ) {
        // First ensure we have the encryption key
        getEncryptionKey(activity, object : CryptoOperationCallback {
            override fun onSuccess(result: String) {
                try {
                    Log.d(TAG, "Saving credential for: ${credential.service}")

                    // Get current credentials from SharedPreferences
                    val prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
                    val encryptedCredentialsJson = prefs.getString(CREDENTIALS_KEY, null)

                    val credentials = if (encryptedCredentialsJson != null) {
                        // Decrypt and parse existing credentials
                        val decryptedJson = decryptData(encryptedCredentialsJson)
                        parseCredentialsFromJson(decryptedJson)
                    } else {
                        // No existing credentials
                        mutableListOf()
                    }

                    // Add new credential
                    credentials.add(credential)

                    // Convert to JSON
                    val jsonData = credentialsToJson(credentials)

                    // Encrypt
                    val encryptedJson = encryptData(jsonData)

                    // Save encrypted data
                    prefs.edit().putString(CREDENTIALS_KEY, encryptedJson).apply()

                    callback.onSuccess("Credential saved successfully")
                } catch (e: Exception) {
                    Log.e(TAG, "Error saving credential", e)
                    callback.onError(e)
                }
            }

            override fun onError(e: Exception) {
                Log.e(TAG, "Failed to get encryption key", e)
                callback.onError(e)
            }
        })
    }

    /**
     * Get all credentials from SharedPreferences with decryption
     */
    fun getAllCredentials(activity: FragmentActivity, callback: CryptoOperationCallback) {
        // First check if credentials exist
        val prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
        val encryptedCredentialsJson = prefs.getString(CREDENTIALS_KEY, null)

        if (encryptedCredentialsJson == null) {
            // No credentials found, return empty array without triggering biometric authentication
            Log.d(TAG, "No credentials found, returning empty array without key retrieval")
            callback.onSuccess(JSONArray().toString())
            return
        }

        // Credentials exist, ensure we have the encryption key
        getEncryptionKey(activity, object : CryptoOperationCallback {
            override fun onSuccess(result: String) {
                try {
                    Log.d(TAG, "Retrieving credentials from SharedPreferences")

                    // Decrypt credentials
                    val decryptedJson = decryptData(encryptedCredentialsJson)

                    callback.onSuccess(decryptedJson)
                } catch (e: Exception) {
                    Log.e(TAG, "Error retrieving credentials", e)
                    callback.onError(e)
                }
            }

            override fun onError(e: Exception) {
                Log.e(TAG, "Failed to get encryption key", e)
                callback.onError(e)
            }
        })
    }

    /**
     * Attempts to get all credentials using only the cached encryption key.
     * Returns false if the key isn't in memory, which signals the caller to authenticate.
     */
    fun tryGetAllCredentialsWithCachedKey(callback: CryptoOperationCallback): Boolean {
        // Check if the encryption key is already in memory
        if (encryptionKey == null) {
            Log.d(TAG, "Encryption key not in memory, authentication required")
            return false
        }

        // Check if credentials exist
        val prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
        val encryptedCredentialsJson = prefs.getString(CREDENTIALS_KEY, null)

        if (encryptedCredentialsJson == null) {
            // No credentials found, return empty array
            Log.d(TAG, "No credentials found, returning empty array")
            callback.onSuccess(JSONArray().toString())
            return true
        }

        try {
            Log.d(TAG, "Retrieving credentials using cached key")

            // Decrypt credentials directly with cached key
            val decryptedJson = decryptData(encryptedCredentialsJson)

            callback.onSuccess(decryptedJson)
            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error retrieving credentials with cached key", e)
            callback.onError(e)
            return true // Still return true since we attempted with a cached key
        }
    }

    /**
     * Clear all credentials from SharedPreferences
     */
    fun clearAllData() {
        Log.d(TAG, "Clearing all credentials from SharedPreferences")
        val prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .remove(CREDENTIALS_KEY)
            .remove(ENCRYPTED_KEY_PREF)
            .apply()

        // Clear the cached encryption key
        encryptionKey = null

        // Remove the key from Android Keystore if it exists
        try {
            val keyStore = KeyStore.getInstance("AndroidKeyStore")
            keyStore.load(null)

            if (keyStore.containsAlias(KEYSTORE_ALIAS)) {
                keyStore.deleteEntry(KEYSTORE_ALIAS)
                Log.d(TAG, "Removed encryption key from Android Keystore")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error removing encryption key from Keystore", e)
        }
    }

    @Throws(JSONException::class)
    private fun parseCredentialsFromJson(json: String?): MutableList<Credential> {
        val credentials = mutableListOf<Credential>()

        if (json.isNullOrEmpty()) {
            return credentials
        }

        val jsonArray = JSONArray(json)

        for (i in 0 until jsonArray.length()) {
            val jsonObject = jsonArray.getJSONObject(i)
            val username = jsonObject.getString("username")
            val password = jsonObject.getString("password")
            val service = jsonObject.getString("service")

            credentials.add(Credential(username, password, service))
        }

        return credentials
    }

    @Throws(JSONException::class)
    private fun credentialsToJson(credentials: List<Credential>): String {
        val jsonArray = JSONArray()

        for (credential in credentials) {
            val jsonObject = JSONObject().apply {
                put("username", credential.username)
                put("password", credential.password)
                put("service", credential.service)
            }

            jsonArray.put(jsonObject)
        }

        return jsonArray.toString()
    }

    companion object {
        private const val TAG = "SharedCredentialStore"
        private const val SHARED_PREFS_NAME = "net.aliasvault.credentials"
        private const val CREDENTIALS_KEY = "stored_credentials"
        private const val KEYSTORE_ALIAS = "net.aliasvault.encryption_key"
        private const val ENCRYPTED_KEY_PREF = "encrypted_key"

        @Volatile
        private var instance: SharedCredentialStore? = null

        @JvmStatic
        fun getInstance(context: Context): SharedCredentialStore {
            return instance ?: synchronized(this) {
                instance ?: SharedCredentialStore(context).also { instance = it }
            }
        }
    }
}