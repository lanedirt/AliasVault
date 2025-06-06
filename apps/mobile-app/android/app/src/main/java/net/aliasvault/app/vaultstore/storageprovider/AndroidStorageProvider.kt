package net.aliasvault.app.vaultstore.storageprovider

import android.content.Context
import androidx.core.content.edit
import java.io.File

/**
 * A file provider that returns the encrypted database file from the Android filesystem.
 */
class AndroidStorageProvider(private val context: Context) : StorageProvider {
    private var defaultAutoLockTimeout = 3600 // 1 hour default

    override fun getEncryptedDatabaseFile(): File {
        return File(context.filesDir, "encrypted_database.db")
    }

    override fun setEncryptedDatabaseFile(encryptedData: String) {
        val file = File(context.filesDir, "encrypted_database.db")
        file.writeText(encryptedData)
    }

    override fun setMetadata(metadata: String) {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        sharedPreferences.edit {
            putString("metadata", metadata)
        }
    }

    override fun getMetadata(): String {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        return sharedPreferences.getString("metadata", "") ?: ""
    }

    override fun setKeyDerivationParams(keyDerivationParams: String) {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        sharedPreferences.edit {
            putString("key_derivation_params", keyDerivationParams)
        }
    }

    override fun getKeyDerivationParams(): String {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        return sharedPreferences.getString("key_derivation_params", "") ?: ""
    }

    override fun setAuthMethods(authMethods: String) {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        sharedPreferences.edit {
            putString("auth_methods", authMethods)
        }
    }

    override fun getAuthMethods(): String {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        return sharedPreferences.getString("auth_methods", "[]") ?: "[]"
    }

    override fun setAutoLockTimeout(timeout: Int) {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        editor.putInt("auto_lock_timeout", timeout)
        editor.apply()
    }

    override fun getAutoLockTimeout(): Int {
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        return sharedPreferences.getInt("auto_lock_timeout", defaultAutoLockTimeout)
    }

    override fun clearStorage() {
        // Clear all shared preferences
        val sharedPreferences = context.getSharedPreferences("aliasvault", Context.MODE_PRIVATE)
        sharedPreferences.edit { clear() }

        // Clear encrypted database file
        val encryptedDatabaseFile = File(context.filesDir, "encrypted_database.db")
        if (encryptedDatabaseFile.exists()) {
            encryptedDatabaseFile.delete()
        }
    }
}
