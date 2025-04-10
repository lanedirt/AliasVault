package net.aliasvault.app.credentialmanager;

import android.app.Activity;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.fragment.app.FragmentActivity;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;

class CredentialManagerModule(private val reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "CredentialManagerModule"
    }
    
    override fun getName(): String {
        return "CredentialManager"
    }
    
    private fun getFragmentActivity(): FragmentActivity? {
        val activity = currentActivity
        return if (activity is FragmentActivity) {
            activity
        } else {
            null
        }
    }
    
    @ReactMethod
    fun addCredential(username: String, password: String, service: String, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                val activity = getFragmentActivity()
                if (activity == null) {
                    promise.reject("ERR_ACTIVITY", "Activity is not available")
                    return@runOnUiThread
                }
                
                val store = SharedCredentialStore.getInstance(reactContext)
                val credential = Credential(username, password, service)
                
                store.saveCredential(activity, credential, object : SharedCredentialStore.CryptoOperationCallback {
                    override fun onSuccess(result: String) {
                        promise.resolve(true)
                    }
                    
                    override fun onError(e: Exception) {
                        Log.e(TAG, "Error adding credential", e)
                        promise.reject("ERR_ADD_CREDENTIAL", "Failed to add credential: ${e.message}", e)
                    }
                })
            } catch (e: Exception) {
                Log.e(TAG, "Error preparing to add credential", e)
                promise.reject("ERR_ADD_CREDENTIAL", "Failed to prepare adding credential: ${e.message}", e)
            }
        }
    }
    
    @ReactMethod
    fun getCredentials(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                val activity = getFragmentActivity()
                if (activity == null) {
                    promise.reject("ERR_ACTIVITY", "Activity is not available")
                    return@runOnUiThread
                }
                
                val store = SharedCredentialStore.getInstance(reactContext)
                
                store.getAllCredentials(activity, object : SharedCredentialStore.CryptoOperationCallback {
                    override fun onSuccess(jsonString: String) {
                        try {
                            val jsonArray = JSONArray(jsonString)
                            val credentialsArray = Arguments.createArray()
                            
                            for (i in 0 until jsonArray.length()) {
                                val jsonObject = jsonArray.getJSONObject(i)
                                val credentialMap = Arguments.createMap()
                                credentialMap.putString("username", jsonObject.getString("username"))
                                credentialMap.putString("password", jsonObject.getString("password"))
                                credentialMap.putString("service", jsonObject.getString("service"))
                                credentialsArray.pushMap(credentialMap)
                            }
                            
                            promise.resolve(credentialsArray)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error parsing credentials", e)
                            promise.reject("ERR_PARSE_CREDENTIALS", "Failed to parse credentials: ${e.message}", e)
                        }
                    }
                    
                    override fun onError(e: Exception) {
                        Log.e(TAG, "Error getting credentials", e)
                        promise.reject("ERR_GET_CREDENTIALS", "Failed to get credentials: ${e.message}", e)
                    }
                })
            } catch (e: Exception) {
                Log.e(TAG, "Error preparing to get credentials", e)
                promise.reject("ERR_GET_CREDENTIALS", "Failed to prepare getting credentials: ${e.message}", e)
            }
        }
    }
    
    @ReactMethod
    fun clearCredentials(promise: Promise) {
        try {
            val store = SharedCredentialStore.getInstance(reactContext)
            store.clearAllData()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing credentials", e)
            promise.reject("ERR_CLEAR_CREDENTIALS", "Failed to clear credentials: ${e.message}", e)
        }
    }
} 