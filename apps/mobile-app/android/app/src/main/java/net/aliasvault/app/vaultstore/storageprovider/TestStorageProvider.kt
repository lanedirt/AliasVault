package net.aliasvault.app.vaultstore.storageprovider

import java.io.File

/**
 * A fake file provider that mocks the storage of the encrypted database file and metadata.
 */
class TestStorageProvider() : StorageProvider {
    private val tempFile = File.createTempFile("encrypted_database", ".db")
    private var tempMetadata = String()
    private var tempKeyDerivationParams = String()
    private var tempAuthMethods = "[]"
    private var tempAutoLockTimeout = 300000L // 5 minutes default

    override fun getEncryptedDatabaseFile(): File = tempFile

    override fun setEncryptedDatabaseFile(encryptedData: String) {
        tempFile.writeText(encryptedData)
    }

    override fun setMetadata(metadata: String) {
        tempMetadata = metadata
    }

    override fun getMetadata(): String {
        return tempMetadata
    }

    override fun setKeyDerivationParams(keyDerivationParams: String) {
        tempKeyDerivationParams = keyDerivationParams
    }

    override fun getKeyDerivationParams(): String {
        return tempKeyDerivationParams
    }

    override fun setAuthMethods(authMethods: String) {
        tempAuthMethods = authMethods
    }

    override fun getAuthMethods(): String {
        return tempAuthMethods
    }

    override fun setAutoLockTimeout(timeout: Long) {
        tempAutoLockTimeout = timeout
    }

    override fun getAutoLockTimeout(): Long {
        return tempAutoLockTimeout
    }
}
