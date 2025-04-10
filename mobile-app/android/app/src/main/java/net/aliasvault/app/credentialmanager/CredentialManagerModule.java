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

public class CredentialManagerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "CredentialManagerModule";
    private final ReactApplicationContext reactContext;
    
    public CredentialManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }
    
    @Override
    public String getName() {
        return "CredentialManager";
    }
    
    private FragmentActivity getFragmentActivity() {
        Activity activity = getCurrentActivity();
        if (activity instanceof FragmentActivity) {
            return (FragmentActivity) activity;
        }
        return null;
    }
    
    @ReactMethod
    public void addCredential(final String username, final String password, final String service, final Promise promise) {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    FragmentActivity activity = getFragmentActivity();
                    if (activity == null) {
                        promise.reject("ERR_ACTIVITY", "Activity is not available");
                        return;
                    }
                    
                    SharedCredentialStore store = SharedCredentialStore.getInstance(reactContext);
                    Credential credential = new Credential(username, password, service);
                    
                    store.saveCredential(activity, credential, new SharedCredentialStore.CryptoOperationCallback() {
                        @Override
                        public void onSuccess(String result) {
                            promise.resolve(true);
                        }
                        
                        @Override
                        public void onError(Exception e) {
                            Log.e(TAG, "Error adding credential", e);
                            promise.reject("ERR_ADD_CREDENTIAL", "Failed to add credential: " + e.getMessage(), e);
                        }
                    });
                } catch (Exception e) {
                    Log.e(TAG, "Error preparing to add credential", e);
                    promise.reject("ERR_ADD_CREDENTIAL", "Failed to prepare adding credential: " + e.getMessage(), e);
                }
            }
        });
    }
    
    @ReactMethod
    public void getCredentials(final Promise promise) {
        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    FragmentActivity activity = getFragmentActivity();
                    if (activity == null) {
                        promise.reject("ERR_ACTIVITY", "Activity is not available");
                        return;
                    }
                    
                    SharedCredentialStore store = SharedCredentialStore.getInstance(reactContext);
                    
                    store.getAllCredentials(activity, new SharedCredentialStore.CryptoOperationCallback() {
                        @Override
                        public void onSuccess(String jsonString) {
                            try {
                                JSONArray jsonArray = new JSONArray(jsonString);
                                WritableArray credentialsArray = Arguments.createArray();
                                
                                for (int i = 0; i < jsonArray.length(); i++) {
                                    JSONObject jsonObject = jsonArray.getJSONObject(i);
                                    WritableMap credentialMap = Arguments.createMap();
                                    credentialMap.putString("username", jsonObject.getString("username"));
                                    credentialMap.putString("password", jsonObject.getString("password"));
                                    credentialMap.putString("service", jsonObject.getString("service"));
                                    credentialsArray.pushMap(credentialMap);
                                }
                                
                                promise.resolve(credentialsArray);
                            } catch (Exception e) {
                                Log.e(TAG, "Error parsing credentials", e);
                                promise.reject("ERR_PARSE_CREDENTIALS", "Failed to parse credentials: " + e.getMessage(), e);
                            }
                        }
                        
                        @Override
                        public void onError(Exception e) {
                            Log.e(TAG, "Error getting credentials", e);
                            promise.reject("ERR_GET_CREDENTIALS", "Failed to get credentials: " + e.getMessage(), e);
                        }
                    });
                } catch (Exception e) {
                    Log.e(TAG, "Error preparing to get credentials", e);
                    promise.reject("ERR_GET_CREDENTIALS", "Failed to prepare getting credentials: " + e.getMessage(), e);
                }
            }
        });
    }
    
    @ReactMethod
    public void clearCredentials(final Promise promise) {
        try {
            SharedCredentialStore store = SharedCredentialStore.getInstance(reactContext);
            store.clearAllData();
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error clearing credentials", e);
            promise.reject("ERR_CLEAR_CREDENTIALS", "Failed to clear credentials: " + e.getMessage(), e);
        }
    }
} 