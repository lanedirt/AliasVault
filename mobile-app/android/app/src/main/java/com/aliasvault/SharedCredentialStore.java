package com.aliasvault;

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

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.UnrecoverableEntryException;
import java.security.cert.CertificateException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.KeyGenerator;
import javax.crypto.NoSuchPaddingException;
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
    
    private Cipher getCipher() throws NoSuchPaddingException, NoSuchAlgorithmException {
        return Cipher.getInstance(KeyProperties.KEY_ALGORITHM_AES + "/"
                + KeyProperties.BLOCK_MODE_GCM + "/"
                + KeyProperties.ENCRYPTION_PADDING_NONE);
    }
    
    private String encrypt(String data) throws Exception {
        SecretKey key = getOrCreateEncryptionKey();
        Cipher cipher = getCipher();
        cipher.init(Cipher.ENCRYPT_MODE, key);
        
        byte[] iv = cipher.getIV();
        byte[] encryptedBytes = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
        
        // Store IV in SharedPreferences
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(CREDENTIALS_KEY + IV_SUFFIX, Base64.encodeToString(iv, Base64.DEFAULT)).apply();
        
        return Base64.encodeToString(encryptedBytes, Base64.DEFAULT);
    }
    
    private String decrypt(String encryptedData) throws Exception {
        SecretKey key = getOrCreateEncryptionKey();
        Cipher cipher = getCipher();
        
        // Get IV from SharedPreferences
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        String ivString = prefs.getString(CREDENTIALS_KEY + IV_SUFFIX, null);
        if (ivString == null) {
            throw new Exception("IV not found for decryption");
        }
        
        byte[] iv = Base64.decode(ivString, Base64.DEFAULT);
        byte[] encryptedBytes = Base64.decode(encryptedData, Base64.DEFAULT);
        
        GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, gcmParameterSpec);
        
        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
    
    public List<Credential> getAllCredentials() throws Exception {
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        String encryptedData = prefs.getString(CREDENTIALS_KEY, null);
        
        if (encryptedData == null) {
            return new ArrayList<>();
        }
        
        String decryptedData = decrypt(encryptedData);
        return parseCredentialsFromJson(decryptedData);
    }
    
    public void addCredential(Credential credential) throws Exception {
        List<Credential> credentials = getAllCredentials();
        credentials.add(credential);
        
        String jsonData = credentialsToJson(credentials);
        String encryptedData = encrypt(jsonData);
        
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(CREDENTIALS_KEY, encryptedData).apply();
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