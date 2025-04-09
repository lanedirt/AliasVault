package net.aliasvault.app.credentialmanager;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

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
    
    @ReactMethod
    public void addCredential(String username, String password, String service, Promise promise) {
        try {
            SharedCredentialStore store = SharedCredentialStore.getInstance(reactContext);
            Credential credential = new Credential(username, password, service);
            store.addCredential(credential);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error adding credential", e);
            promise.reject("ERR_ADD_CREDENTIAL", "Failed to add credential: " + e.getMessage(), e);
        }
    }
    
    @ReactMethod
    public void getCredentials(Promise promise) {
        try {
            SharedCredentialStore store = SharedCredentialStore.getInstance(reactContext);
            List<Credential> credentials = store.getAllCredentials();
            
            WritableArray credentialsArray = Arguments.createArray();
            for (Credential credential : credentials) {
                WritableMap credentialMap = Arguments.createMap();
                credentialMap.putString("username", credential.getUsername());
                credentialMap.putString("password", credential.getPassword());
                credentialMap.putString("service", credential.getService());
                credentialsArray.pushMap(credentialMap);
            }
            
            promise.resolve(credentialsArray);
        } catch (Exception e) {
            Log.e(TAG, "Error getting credentials", e);
            promise.reject("ERR_GET_CREDENTIALS", "Failed to get credentials: " + e.getMessage(), e);
        }
    }
    
    @ReactMethod
    public void clearCredentials(Promise promise) {
        try {
            SharedCredentialStore store = SharedCredentialStore.getInstance(reactContext);
            store.clearAllCredentials();
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error clearing credentials", e);
            promise.reject("ERR_CLEAR_CREDENTIALS", "Failed to clear credentials: " + e.getMessage(), e);
        }
    }
} 