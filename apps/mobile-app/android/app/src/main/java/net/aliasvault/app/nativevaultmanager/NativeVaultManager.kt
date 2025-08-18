package net.aliasvault.app.nativevaultmanager

import android.content.Intent
import android.provider.Settings
import android.util.Log
import androidx.core.net.toUri
import androidx.fragment.app.FragmentActivity
import com.aliasvault.nativevaultmanager.NativeVaultManagerSpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import net.aliasvault.app.vaultstore.VaultStore
import net.aliasvault.app.vaultstore.keystoreprovider.AndroidKeystoreProvider
import net.aliasvault.app.vaultstore.storageprovider.AndroidStorageProvider
import org.json.JSONArray

/**
 * The native vault manager that manages the vault store and all input/output operations on it.
 * This class implements the NativeVaultManagerSpec React Native interface and then calls the
 * VaultStore class to perform the actual operations.
 *
 * @param reactContext The React context
 */
@ReactModule(name = NativeVaultManager.NAME)
class NativeVaultManager(reactContext: ReactApplicationContext) :
    NativeVaultManagerSpec(reactContext), TurboModule, LifecycleEventListener {

    companion object {
        /**
         * The name of the module.
         */
        const val NAME = "NativeVaultManager"

        /**
         * The tag for logging.
         */
        private const val TAG = "NativeVaultManager"
    }

    private val vaultStore = VaultStore.getInstance(
        AndroidKeystoreProvider(reactContext) { getFragmentActivity() },
        AndroidStorageProvider(reactContext),
    )

    init {
        // Register for lifecycle callbacks
        reactContext.addLifecycleEventListener(this)
    }

    /**
     * Called when the app enters the background.
     */
    override fun onHostPause() {
        Log.d(TAG, "App entered background")
        vaultStore.onAppBackgrounded()
    }

    /**
     * Called when the app enters the foreground.
     */
    override fun onHostResume() {
        Log.d(TAG, "App entered foreground")
        vaultStore.onAppForegrounded()
    }

    /**
     * Called when the app is destroyed.
     */
    override fun onHostDestroy() {
        // Not needed
    }

    /**
     * Get the name of the module.
     * @return The name of the module
     */
    override fun getName(): String {
        return NAME
    }

    /**
     * Clear the vault.
     * @param promise The promise to resolve
     */
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

    /**
     * Check if the vault is unlocked.
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun isVaultUnlocked(promise: Promise) {
        promise.resolve(vaultStore.isVaultUnlocked())
    }

    /**
     * Get the vault metadata.
     * @param promise The promise to resolve
     */
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

    /**
     * Unlock the vault.
     * @param promise The promise to resolve
     */
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

    /**
     * Store the encrypted database.
     * @param base64EncryptedDb The encrypted database as a base64 encoded string
     * @param promise The promise to resolve
     */
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

    /**
     * Store the metadata.
     * @param metadata The metadata as a string
     * @param promise The promise to resolve
     */
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

    /**
     * Set the auth methods.
     * @param authMethods The auth methods
     * @param promise The promise to resolve
     */
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

    /**
     * Store the encryption key.
     * @param base64EncryptionKey The encryption key as a base64 encoded string
     * @param promise The promise to resolve
     */
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

    /**
     * Store the encryption key derivation parameters.
     * @param keyDerivationParams The encryption key derivation parameters
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun storeEncryptionKeyDerivationParams(keyDerivationParams: String, promise: Promise) {
        try {
            vaultStore.storeEncryptionKeyDerivationParams(keyDerivationParams)
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error storing key derivation params", e)
            promise.reject(
                "ERR_STORE_KEY_PARAMS",
                "Failed to store key derivation params: ${e.message}",
                e,
            )
        }
    }

    /**
     * Get the encryption key derivation parameters.
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun getEncryptionKeyDerivationParams(promise: Promise) {
        try {
            val params = vaultStore.getEncryptionKeyDerivationParams()
            promise.resolve(params)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting key derivation params", e)
            promise.reject(
                "ERR_GET_KEY_PARAMS",
                "Failed to get key derivation params: ${e.message}",
                e,
            )
        }
    }

    /**
     * Check if the encrypted database exists.
     * @param promise The promise to resolve
     */
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

    /**
     * Get the encrypted database.
     * @param promise The promise to resolve
     */
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

    /**
     * Get the current vault revision number.
     * @param promise The promise to resolve
     */
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

    /**
     * Set the current vault revision number.
     * @param revisionNumber The revision number
     * @param promise The promise to resolve
     */
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

    /**
     * Execute a query on the vault.
     * @param query The query
     * @param params The parameters to the query
     * @param promise The promise to resolve
     */
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
                        is ByteArray -> rowMap.putString(
                            key,
                            android.util.Base64.encodeToString(value, android.util.Base64.NO_WRAP),
                        )
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

    /**
     * Execute an update on the vault.
     * @param query The query
     * @param params The parameters to the query
     * @param promise The promise to resolve
     */
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

    /**
     * Execute a raw SQL query on the vault without parameters.
     * @param query The raw SQL query
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun executeRaw(query: String, promise: Promise) {
        try {
            vaultStore.executeRaw(query)
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error executing raw query", e)
            promise.reject("ERR_EXECUTE_RAW", "Failed to execute raw query: ${e.message}", e)
        }
    }

    /**
     * Begin a transaction on the vault.
     * @param promise The promise to resolve
     */
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

    /**
     * Commit a transaction on the vault.
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun commitTransaction(promise: Promise) {
        try {
            vaultStore.commitTransaction()
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error committing transaction", e)
            promise.reject(
                "ERR_COMMIT_TRANSACTION",
                "Failed to commit transaction: ${e.message}",
                e,
            )
        }
    }

    /**
     * Rollback a transaction on the vault.
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun rollbackTransaction(promise: Promise) {
        try {
            vaultStore.rollbackTransaction()
            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error rolling back transaction", e)
            promise.reject(
                "ERR_ROLLBACK_TRANSACTION",
                "Failed to rollback transaction: ${e.message}",
                e,
            )
        }
    }

    /**
     * Set the auto-lock timeout.
     * @param timeout The timeout in seconds
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun setAutoLockTimeout(timeout: Double, promise: Promise?) {
        try {
            vaultStore.setAutoLockTimeout(timeout.toInt())
            promise?.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error setting auto-lock timeout", e)
            promise?.reject("ERR_SET_TIMEOUT", "Failed to set auto-lock timeout: ${e.message}", e)
        }
    }

    /**
     * Get the auto-lock timeout.
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun getAutoLockTimeout(promise: Promise) {
        try {
            val timeout = vaultStore.getAutoLockTimeout()
            promise.resolve(timeout)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting auto-lock timeout", e)
            promise.reject("ERR_GET_TIMEOUT", "Failed to get auto-lock timeout: ${e.message}", e)
        }
    }

    /**
     * Clear clipboard after a delay.
     * @param delayInSeconds The delay in seconds after which to clear the clipboard
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun clearClipboardAfterDelay(delayInSeconds: Double, promise: Promise?) {
        Log.d(TAG, "Scheduling clipboard clear after $delayInSeconds seconds")

        if (delayInSeconds <= 0) {
            Log.d(TAG, "Delay is 0 or negative, not scheduling clipboard clear")
            promise?.resolve(null)
            return
        }

        val handler = android.os.Handler(android.os.Looper.getMainLooper())
        val delayMs = (delayInSeconds * 1000).toLong()

        handler.postDelayed({
            try {
                Log.d(TAG, "Clearing clipboard after $delayInSeconds seconds delay")
                val clipboardManager = reactApplicationContext.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                clipboardManager.clearPrimaryClip()
                Log.d(TAG, "Clipboard cleared successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error clearing clipboard", e)
            }
        }, delayMs)

        promise?.resolve(null)
    }

    /**
     * Get the auth methods.
     * @param promise The promise to resolve
     */
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

    /**
     * Open the autofill settings page.
     * @param promise The promise to resolve
     */
    @ReactMethod
    override fun openAutofillSettingsPage(promise: Promise) {
        try {
            // Note: we add a 2 to the packageUri on purpose because if we don't,
            // when the user has configured AliasVault as the autofill service already
            // this action won't open the settings anymore, making the button in the UI
            // become broken and not do anything anymore. This is not good UX so instead
            // we append a "2" so Android will always open the page as it does not equal
            // the actual chosen option.
            val packageUri = "package:${reactApplicationContext.packageName}2".toUri()
            val autofillIntent = Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE).apply {
                data = packageUri
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            // Try to resolve the intent first
            if (autofillIntent.resolveActivity(reactApplicationContext.packageManager) != null) {
                reactApplicationContext.startActivity(autofillIntent)
            } else {
                // Fallback to privacy settings (may contain Autofill on Samsung)
                val fallbackIntent = Intent(Settings.ACTION_PRIVACY_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(fallbackIntent)
            }

            promise.resolve(null)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening autofill settings", e)
            promise.reject(
                "ERR_OPEN_AUTOFILL_SETTINGS",
                "Failed to open autofill settings: ${e.message}",
                e,
            )
        }
    }

    /**
     * Get the current fragment activity.
     * @return The fragment activity
     */
    private fun getFragmentActivity(): FragmentActivity? {
        return currentActivity as? FragmentActivity
    }
}
