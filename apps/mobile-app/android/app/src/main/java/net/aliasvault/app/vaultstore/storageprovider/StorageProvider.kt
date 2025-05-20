package net.aliasvault.app.vaultstore.storageprovider

import java.io.File

/**
 * A storage provider that abstracts the storage of the encrypted database file and metadata (SharedPreferences).
 */
interface StorageProvider {
    fun getEncryptedDatabaseFile(): File
    fun setEncryptedDatabaseFile(encryptedData: String)
    fun setMetadata(metadata: String)
    fun getMetadata(): String
    fun setKeyDerivationParams(keyDerivationParams: String)
    fun getKeyDerivationParams(): String
}
