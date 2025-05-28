package net.aliasvault.app.vaultstore.keystoreprovider

/**
 * Interface for keystore providers that handle secure storage of encryption keys with biometric protection.
 * This allows for different implementations for real devices and testing.
 */
interface KeystoreProvider {
    /**
     * Check if biometric authentication is available on the device
     * @return true if biometric authentication is available, false otherwise
     */
    fun isBiometricAvailable(): Boolean

    /**
     * Store an encryption key with biometric protection
     * @param activity The activity to show the biometric prompt on
     * @param key The encryption key to store
     * @param callback The callback to handle the result
     */
    fun storeKey(key: String, callback: KeystoreOperationCallback)

    /**
     * Retrieve an encryption key using biometric authentication
     * @param activity The activity to show the biometric prompt on
     * @param callback The callback to handle the result
     */
    fun retrieveKey(callback: KeystoreOperationCallback)

    /**
     * Clear all stored keys
     */
    fun clearKeys()
}

/**
 * Callback interface for keystore operations
 */
interface KeystoreOperationCallback {
    fun onSuccess(result: String)
    fun onError(e: Exception)
}
