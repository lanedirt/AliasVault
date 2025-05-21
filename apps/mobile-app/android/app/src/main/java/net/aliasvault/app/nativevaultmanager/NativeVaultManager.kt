package net.aliasvault.app.nativevaultmanager

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.react.bridge.ReactApplicationContext

import android.app.Activity
import android.util.Log
import androidx.fragment.app.FragmentActivity
import com.aliasvault.nativevaultmanager.NativeVaultManagerSpec
import com.facebook.react.bridge.*
import org.json.JSONArray
import net.aliasvault.app.vaultstore.VaultStore
import net.aliasvault.app.vaultstore.storageprovider.AndroidStorageProvider
import net.aliasvault.app.vaultstore.keystoreprovider.AndroidKeystoreProvider

@ReactModule(name = NativeVaultManager.NAME)
class NativeVaultManager(reactContext: ReactApplicationContext) :
    NativeVaultManagerSpec(reactContext), TurboModule {

    companion object {
        private const val TAG = "NativeVaultManager"
        const val NAME = "NativeVaultManager"
    }

    private val vaultStore = VaultStore(
        AndroidStorageProvider(reactContext),
        AndroidKeystoreProvider(reactContext, getFragmentActivity())
    )

    override fun getName(): String {
        return NAME
    }

    private fun getFragmentActivity(): FragmentActivity? {
        val activity = currentActivity
        return if (activity is FragmentActivity) {
            activity
        } else {
            null
        }
    }

    // Basic credential operations
    @ReactMethod
    override fun clearVault(promise: Promise) {
        try {
            vaultStore.clearVault()
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing vault", e)
            promise.reject("ERR_CLEAR_VAULT", "Failed to clear vault: ${e.message}", e)
        }
    }

    // Vault state management
    @ReactMethod
    override fun isVaultUnlocked(promise: Promise) {
        promise.resolve(vaultStore.isVaultUnlocked())
    }

    @ReactMethod
    override fun getVaultMetadata(promise: Promise) {
        try {
            val metadata = vaultStore.getMetadata()
            promise.resolve(metadata)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting vault metadata", e)
            promise.reject("ERR_GET_METADATA", "Failed to get vault metadata: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun unlockVault(promise: Promise) {
        try {
            vaultStore.unlockVault()
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error storing encryption key", e)
            promise.reject("ERR_STORE_KEY", "Failed to store encryption key: ${e.message}", e)
        }
    }

    // Database operations
    @ReactMethod
    override fun storeDatabase(base64EncryptedDb: String, promise: Promise) {
        try {
            vaultStore.storeEncryptedDatabase(base64EncryptedDb)
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error storing database", e)
            promise.reject("ERR_STORE_DB", "Failed to store database: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun storeMetadata(metadata: String, promise: Promise) {
        try {
            vaultStore.storeMetadata(metadata)
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error storing metadata", e)
            promise.reject("ERR_STORE_METADATA", "Failed to store metadata: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun setAuthMethods(authMethods: ReadableArray, promise: Promise) {
        try {
            val jsonArray = JSONArray()
            for (i in 0 until authMethods.size()) {
                jsonArray.put(authMethods.getString(i))
            }
            vaultStore.setAuthMethods(jsonArray.toString())
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error setting auth methods", e)
            promise.reject("ERR_SET_AUTH_METHODS", "Failed to set auth methods: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun storeEncryptionKey(base64EncryptionKey: String, promise: Promise) {
        try {
            vaultStore.storeEncryptionKey(base64EncryptionKey)
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error storing encryption key", e)
            promise.reject("ERR_STORE_KEY", "Failed to store encryption key: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun storeEncryptionKeyDerivationParams(keyDerivationParams: String, promise: Promise) {
        try {
            vaultStore.storeEncryptionKeyDerivationParams(keyDerivationParams)
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error storing key derivation params", e)
            promise.reject("ERR_STORE_KEY_PARAMS", "Failed to store key derivation params: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun getEncryptionKeyDerivationParams(promise: Promise) {
        try {
            val params = vaultStore.getEncryptionKeyDerivationParams()
            promise.resolve(params)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting key derivation params", e)
            promise.reject("ERR_GET_KEY_PARAMS", "Failed to get key derivation params: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun hasEncryptedDatabase(promise: Promise) {
        try {
            val hasDb = vaultStore.hasEncryptedDatabase()
            promise.resolve(hasDb)
        } catch (e: Exception) {
            Log.e(TAG, "Error checking encrypted database", e)
            promise.reject("ERR_CHECK_DB", "Failed to check encrypted database: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun getEncryptedDatabase(promise: Promise) {
        try {
            val encryptedDb = vaultStore.getEncryptedDatabase()
            promise.resolve(encryptedDb)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting encrypted database", e)
            promise.reject("ERR_GET_DB", "Failed to get encrypted database: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun getCurrentVaultRevisionNumber(promise: Promise) {
        try {
            val revision = vaultStore.getVaultRevisionNumber()
            promise.resolve(revision)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting vault revision", e)
            promise.reject("ERR_GET_REVISION", "Failed to get vault revision: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun setCurrentVaultRevisionNumber(revisionNumber: Double, promise: Promise?) {
        try {
            vaultStore.setVaultRevisionNumber(revisionNumber.toInt())
            promise?.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error setting vault revision", e)
            promise?.reject("ERR_SET_REVISION", "Failed to set vault revision: ${e.message}", e)
        }
    }

    // SQL operations
    @ReactMethod
    override fun executeQuery(query: String, params: ReadableArray, promise: Promise) {
        try {
            val paramsArray = Array<Any?>(params.size()) { i ->
                when (params.getType(i)) {
                    ReadableType.Null -> null
                    ReadableType.Boolean -> params.getBoolean(i)
                    ReadableType.Number -> params.getDouble(i)
                    ReadableType.String -> params.getString(i)
                    else -> null
                }
            }

            val results = vaultStore.executeQuery(query, paramsArray)
            val resultArray = Arguments.createArray()

            for (row in results) {
                val rowMap = Arguments.createMap()
                for ((key, value) in row) {
                    when (value) {
                        null -> rowMap.putNull(key)
                        is Boolean -> rowMap.putBoolean(key, value)
                        is Int -> rowMap.putInt(key, value)
                        is Long -> rowMap.putDouble(key, value.toDouble())
                        is Float -> rowMap.putDouble(key, value.toDouble())
                        is Double -> rowMap.putDouble(key, value)
                        is String -> rowMap.putString(key, value)
                        is ByteArray -> rowMap.putString(key, android.util.Base64.encodeToString(value, android.util.Base64.DEFAULT))
                        else -> rowMap.putString(key, value.toString())
                    }
                }
                resultArray.pushMap(rowMap)
            }

            promise.resolve(resultArray)
        } catch (e: Exception) {
            Log.e(TAG, "Error executing query", e)
            promise.reject("ERR_EXECUTE_QUERY", "Failed to execute query: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun executeUpdate(query: String, params: ReadableArray, promise: Promise) {
        try {
            val paramsArray = Array<Any?>(params.size()) { i ->
                when (params.getType(i)) {
                    ReadableType.Null -> null
                    ReadableType.Boolean -> params.getBoolean(i)
                    ReadableType.Number -> params.getDouble(i)
                    ReadableType.String -> params.getString(i)
                    else -> null
                }
            }

            val affectedRows = vaultStore.executeUpdate(query, paramsArray)
            promise.resolve(affectedRows)
        } catch (e: Exception) {
            Log.e(TAG, "Error executing update", e)
            promise.reject("ERR_EXECUTE_UPDATE", "Failed to execute update: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun beginTransaction(promise: Promise) {
        try {
            vaultStore.beginTransaction()
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error beginning transaction", e)
            promise.reject("ERR_BEGIN_TRANSACTION", "Failed to begin transaction: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun commitTransaction(promise: Promise) {
        try {
            vaultStore.commitTransaction()
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error committing transaction", e)
            promise.reject("ERR_COMMIT_TRANSACTION", "Failed to commit transaction: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun rollbackTransaction(promise: Promise) {
        try {
            vaultStore.rollbackTransaction()
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error rolling back transaction", e)
            promise.reject("ERR_ROLLBACK_TRANSACTION", "Failed to rollback transaction: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun setAutoLockTimeout(timeout: Double, promise: Promise?) {
        try {
            vaultStore.setAutoLockTimeout(timeout.toLong())
            promise?.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error setting auto-lock timeout", e)
            promise?.reject("ERR_SET_TIMEOUT", "Failed to set auto-lock timeout: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun getAutoLockTimeout(promise: Promise) {
        try {
            val timeout = vaultStore.getAutoLockTimeout()
            promise.resolve(timeout.toInt())
        } catch (e: Exception) {
            Log.e(TAG, "Error getting auto-lock timeout", e)
            promise.reject("ERR_GET_TIMEOUT", "Failed to get auto-lock timeout: ${e.message}", e)
        }
    }

    @ReactMethod
    override fun getAuthMethods(promise: Promise) {
        try {
            val methodsJson = vaultStore.getAuthMethods()
            val jsonArray = JSONArray(methodsJson)
            val methods = Arguments.createArray()

            for (i in 0 until jsonArray.length()) {
                methods.pushString(jsonArray.getString(i))
            }

            promise.resolve(methods)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting auth methods", e)
            promise.reject("ERR_GET_AUTH_METHODS", "Failed to get auth methods: ${e.message}", e)
        }
    }
}
