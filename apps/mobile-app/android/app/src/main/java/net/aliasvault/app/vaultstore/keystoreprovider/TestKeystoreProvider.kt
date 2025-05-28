package net.aliasvault.app.vaultstore.keystoreprovider

/**
 * Test implementation of the keystore provider that does nothing and always returns false for biometric availability.
 * This is used for testing when biometrics are not available.
 */
class TestKeystoreProvider : KeystoreProvider {
    override fun isBiometricAvailable(): Boolean {
        return false
    }

    override fun storeKey(key: String, callback: KeystoreOperationCallback) {
        // Do nothing in test implementation
        callback.onSuccess("Key stored successfully (test)")
    }

    override fun retrieveKey(callback: KeystoreOperationCallback) {
        // Do nothing in test implementation
        callback.onError(Exception("No key found (test)"))
    }

    override fun clearKeys() {
        // Do nothing in test implementation
    }
}
