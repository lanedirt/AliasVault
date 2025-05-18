package net.aliasvault.app.vaultstore.storageprovider

import android.content.Context
import java.io.File

/**
 * A file provider that returns the encrypted database file from the Android filesystem.
 */
class AndroidStorageProvider(private val context: Context) : StorageProvider {
    override fun getEncryptedDatabaseFile(): File {
        return File(context.filesDir, "encrypted_database.db")
    }

    override fun setEncryptedDatabaseFile(encryptedData: String) {
        val file = File(context.filesDir, "encrypted_database.db")
        file.writeText(encryptedData)
    }

    override fun setMetadata(metadata: String) {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        editor.putString("metadata", metadata)
        editor.apply()
    }

    override fun getMetadata(): String {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        return sharedPreferences.getString("metadata", "") ?: ""
    }
}
