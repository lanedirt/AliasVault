package net.aliasvault.app.vaultstore.storageprovider

import java.io.File

/**
 * A fake file provider that mocks the storage of the encrypted database file and metadata.
 */
class TestStorageProvider() : StorageProvider {
    private val tempFile = File.createTempFile("encrypted_database", ".db")
    private var tempMetadata = String()

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
}
