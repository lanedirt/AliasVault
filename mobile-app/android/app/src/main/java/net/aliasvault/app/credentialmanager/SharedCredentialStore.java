package net.aliasvault.app.credentialmanager;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;

import androidx.biometric.BiometricPrompt;
import androidx.fragment.app.FragmentActivity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

public class SharedCredentialStore {
    private static final String TAG = "SharedCredentialStore";
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String ENCRYPTION_KEY_ALIAS = "aliasvault_encryption_key";
    private static final String SHARED_PREFS_NAME = "net.aliasvault.autofill";
    private static final String CREDENTIALS_KEY = "storedCredentials";
    private static final String IV_SUFFIX = "_iv";
    
    private static SharedCredentialStore instance;
    private final Context appContext;
    private SecretKey cachedEncryptionKey;
    
    // Interface for crypto operations that need biometric auth
    public interface CryptoOperationCallback {
        void onSuccess(String result);
        void onError(Exception e);
    }
    
    private SharedCredentialStore(Context context) {
        this.appContext = context.getApplicationContext();
    }
    
    public static synchronized SharedCredentialStore getInstance(Context context) {
        if (instance == null) {
            instance = new SharedCredentialStore(context);
        }
        return instance;
    }
    
    private SecretKey getOrCreateEncryptionKey() throws Exception {
        if (cachedEncryptionKey != null) {
            return cachedEncryptionKey;
        }
        
        try {
            KeyStore keyStore = KeyStore.getInstance(ANDROID_KEYSTORE);
            keyStore.load(null);
            
            // Check if the key exists
            if (keyStore.containsAlias(ENCRYPTION_KEY_ALIAS)) {
                // Key exists, retrieve it
                KeyStore.SecretKeyEntry secretKeyEntry = (KeyStore.SecretKeyEntry) keyStore.getEntry(
                        ENCRYPTION_KEY_ALIAS, null);
                cachedEncryptionKey = secretKeyEntry.getSecretKey();
                return cachedEncryptionKey;
            } else {
                // Key doesn't exist, create it
                KeyGenerator keyGenerator = KeyGenerator.getInstance(
                        KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
                
                KeyGenParameterSpec keyGenParameterSpec = new KeyGenParameterSpec.Builder(
                        ENCRYPTION_KEY_ALIAS,
                        KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setKeySize(256)
                        .setUserAuthenticationRequired(true)
                        // This is critical: set validation timeout to prevent requiring auth for each operation
                        .setUserAuthenticationValidityDurationSeconds(30)
                        .build();
                
                keyGenerator.init(keyGenParameterSpec);
                cachedEncryptionKey = keyGenerator.generateKey();
                return cachedEncryptionKey;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting or creating encryption key", e);
            throw e;
        }
    }
    
    private Cipher getCipher() throws Exception {
        return Cipher.getInstance(KeyProperties.KEY_ALGORITHM_AES + "/"
                + KeyProperties.BLOCK_MODE_GCM + "/"
                + KeyProperties.ENCRYPTION_PADDING_NONE);
    }
    
    public void encryptWithBiometricAuth(final FragmentActivity activity, final String data, final CryptoOperationCallback callback) {
        try {
            final SecretKey key = getOrCreateEncryptionKey();
            final Cipher cipher = getCipher();
            cipher.init(Cipher.ENCRYPT_MODE, key);
            
            // Create biometric prompt
            final Executor executor = Executors.newSingleThreadExecutor();
            final BiometricPrompt.AuthenticationCallback authCallback = new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                    try {
                        // Get the authenticated cipher
                        Cipher authenticatedCipher = result.getCryptoObject().getCipher();
                        
                        // Perform encryption
                        byte[] iv = authenticatedCipher.getIV();
                        byte[] encryptedBytes = authenticatedCipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
                        
                        // Store IV in SharedPreferences
                        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
                        prefs.edit().putString(CREDENTIALS_KEY + IV_SUFFIX, Base64.encodeToString(iv, Base64.DEFAULT)).apply();
                        
                        callback.onSuccess(Base64.encodeToString(encryptedBytes, Base64.DEFAULT));
                    } catch (Exception e) {
                        callback.onError(e);
                    }
                }
                
                @Override
                public void onAuthenticationError(int errorCode, CharSequence errString) {
                    callback.onError(new Exception("Authentication error: " + errString));
                }
                
                @Override
                public void onAuthenticationFailed() {
                    callback.onError(new Exception("Authentication failed"));
                }
            };
            
            // Show biometric prompt on main thread
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor, authCallback);
                        
                        // Show biometric prompt
                        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                                .setTitle("Authenticate to Secure Credentials")
                                .setSubtitle("Authentication is required to securely store credentials")
                                .setNegativeButtonText("Cancel")
                                .build();
                        
                        biometricPrompt.authenticate(promptInfo, new BiometricPrompt.CryptoObject(cipher));
                    } catch (Exception e) {
                        callback.onError(e);
                    }
                }
            });
            
        } catch (Exception e) {
            callback.onError(e);
        }
    }
    
    public void decryptWithBiometricAuth(final FragmentActivity activity, final String encryptedData, final CryptoOperationCallback callback) {
        try {
            final SecretKey key = getOrCreateEncryptionKey();
            final Cipher cipher = getCipher();
            
            // Get IV from SharedPreferences
            SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
            String ivString = prefs.getString(CREDENTIALS_KEY + IV_SUFFIX, null);
            if (ivString == null) {
                callback.onError(new Exception("IV not found for decryption"));
                return;
            }
            
            byte[] iv = Base64.decode(ivString, Base64.DEFAULT);
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(128, iv);
            cipher.init(Cipher.DECRYPT_MODE, key, gcmParameterSpec);
            
            // Create biometric prompt
            final Executor executor = Executors.newSingleThreadExecutor();
            final BiometricPrompt.AuthenticationCallback authCallback = new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                    try {
                        // Get the authenticated cipher
                        Cipher authenticatedCipher = result.getCryptoObject().getCipher();
                        
                        // Perform decryption
                        byte[] encryptedBytes = Base64.decode(encryptedData, Base64.DEFAULT);
                        byte[] decryptedBytes = authenticatedCipher.doFinal(encryptedBytes);
                        String decryptedData = new String(decryptedBytes, StandardCharsets.UTF_8);
                        
                        callback.onSuccess(decryptedData);
                    } catch (Exception e) {
                        callback.onError(e);
                    }
                }
                
                @Override
                public void onAuthenticationError(int errorCode, CharSequence errString) {
                    callback.onError(new Exception("Authentication error: " + errString));
                }
                
                @Override
                public void onAuthenticationFailed() {
                    callback.onError(new Exception("Authentication failed"));
                }
            };
            
            // Show biometric prompt on main thread
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor, authCallback);
                        
                        // Show biometric prompt
                        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                                .setTitle("Authenticate to Access Credentials")
                                .setSubtitle("Authentication is required to access your credentials")
                                .setNegativeButtonText("Cancel")
                                .build();
                        
                        biometricPrompt.authenticate(promptInfo, new BiometricPrompt.CryptoObject(cipher));
                    } catch (Exception e) {
                        callback.onError(e);
                    }
                }
            });
            
        } catch (Exception e) {
            callback.onError(e);
        }
    }
    
    public void getAllCredentialsWithBiometricAuth(final FragmentActivity activity, final CryptoOperationCallback callback) {
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        final String encryptedData = prefs.getString(CREDENTIALS_KEY, null);
        
        if (encryptedData == null) {
            try {
                callback.onSuccess(new JSONArray().toString());
            } catch (Exception e) {
                callback.onError(e);
            }
            return;
        }
        
        decryptWithBiometricAuth(activity, encryptedData, new CryptoOperationCallback() {
            @Override
            public void onSuccess(String decryptedData) {
                callback.onSuccess(decryptedData);
            }
            
            @Override
            public void onError(Exception e) {
                callback.onError(e);
            }
        });
    }
    
    public void addCredentialWithBiometricAuth(final FragmentActivity activity, final Credential credential, final CryptoOperationCallback callback) {
        getAllCredentialsWithBiometricAuth(activity, new CryptoOperationCallback() {
            @Override
            public void onSuccess(String result) {
                try {
                    List<Credential> credentials = parseCredentialsFromJson(result);
                    credentials.add(credential);
                    
                    String jsonData = credentialsToJson(credentials);
                    encryptWithBiometricAuth(activity, jsonData, new CryptoOperationCallback() {
                        @Override
                        public void onSuccess(String encryptedData) {
                            SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit().putString(CREDENTIALS_KEY, encryptedData).apply();
                            callback.onSuccess("Credential added successfully");
                        }
                        
                        @Override
                        public void onError(Exception e) {
                            callback.onError(e);
                        }
                    });
                } catch (Exception e) {
                    callback.onError(e);
                }
            }
            
            @Override
            public void onError(Exception e) {
                // If there's an error getting credentials (might be first use), create a new list
                try {
                    List<Credential> credentials = new ArrayList<>();
                    credentials.add(credential);
                    
                    String jsonData = credentialsToJson(credentials);
                    encryptWithBiometricAuth(activity, jsonData, new CryptoOperationCallback() {
                        @Override
                        public void onSuccess(String encryptedData) {
                            SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
                            prefs.edit().putString(CREDENTIALS_KEY, encryptedData).apply();
                            callback.onSuccess("Credential added successfully");
                        }
                        
                        @Override
                        public void onError(Exception e) {
                            callback.onError(e);
                        }
                    });
                } catch (Exception ex) {
                    callback.onError(ex);
                }
            }
        });
    }
    
    public void clearAllCredentials() {
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .remove(CREDENTIALS_KEY)
            .remove(CREDENTIALS_KEY + IV_SUFFIX)
            .apply();
        
        try {
            KeyStore keyStore = KeyStore.getInstance(ANDROID_KEYSTORE);
            keyStore.load(null);
            if (keyStore.containsAlias(ENCRYPTION_KEY_ALIAS)) {
                keyStore.deleteEntry(ENCRYPTION_KEY_ALIAS);
            }
            cachedEncryptionKey = null;
        } catch (Exception e) {
            Log.e(TAG, "Error clearing encryption key", e);
        }
    }
    
    public void clearCache() {
        cachedEncryptionKey = null;
    }
    
    private List<Credential> parseCredentialsFromJson(String json) throws JSONException {
        List<Credential> credentials = new ArrayList<>();
        
        if (json == null || json.isEmpty()) {
            return credentials;
        }
        
        JSONArray jsonArray = new JSONArray(json);
        
        for (int i = 0; i < jsonArray.length(); i++) {
            JSONObject jsonObject = jsonArray.getJSONObject(i);
            String username = jsonObject.getString("username");
            String password = jsonObject.getString("password");
            String service = jsonObject.getString("service");
            
            credentials.add(new Credential(username, password, service));
        }
        
        return credentials;
    }
    
    private String credentialsToJson(List<Credential> credentials) throws JSONException {
        JSONArray jsonArray = new JSONArray();
        
        for (Credential credential : credentials) {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("username", credential.getUsername());
            jsonObject.put("password", credential.getPassword());
            jsonObject.put("service", credential.getService());
            
            jsonArray.put(jsonObject);
        }
        
        return jsonArray.toString();
    }
} 