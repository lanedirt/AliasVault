package net.aliasvault.app.credentialmanager;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import android.util.Log;
import java.nio.ByteBuffer;

import androidx.fragment.app.FragmentActivity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class SharedCredentialStore {
    private static final String TAG = "SharedCredentialStore";
    private static final String SHARED_PREFS_NAME = "net.aliasvault.credentials";
    private static final String CREDENTIALS_KEY = "stored_credentials";
    
    // Hardcoded encryption key (32 bytes for AES-256)
    private static final byte[] ENCRYPTION_KEY = {
        0x01, 0x23, 0x45, 0x67, (byte) 0x89, (byte) 0xAB, (byte) 0xCD, (byte) 0xEF,
        0x01, 0x23, 0x45, 0x67, (byte) 0x89, (byte) 0xAB, (byte) 0xCD, (byte) 0xEF,
        0x01, 0x23, 0x45, 0x67, (byte) 0x89, (byte) 0xAB, (byte) 0xCD, (byte) 0xEF,
        0x01, 0x23, 0x45, 0x67, (byte) 0x89, (byte) 0xAB, (byte) 0xCD, (byte) 0xEF
    };
    
    private static SharedCredentialStore instance;
    private final Context appContext;
    
    // Interface for operations that need callbacks
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
    
    /**
     * Encrypts data using AES/GCM/NoPadding
     */
    private String encryptData(String plaintext) throws Exception {
        // Create cipher
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        
        // Create secret key from hardcoded bytes
        SecretKeySpec secretKeySpec = new SecretKeySpec(ENCRYPTION_KEY, "AES");
        
        // Initialize cipher for encryption
        cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
        
        // Get IV
        byte[] iv = cipher.getIV();
        
        // Encrypt data
        byte[] encryptedBytes = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        
        // Combine IV and encrypted data
        ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedBytes.length);
        byteBuffer.put(iv);
        byteBuffer.put(encryptedBytes);
        byte[] combined = byteBuffer.array();
        
        // Return Base64 encoded combined data
        return Base64.encodeToString(combined, Base64.DEFAULT);
    }
    
    /**
     * Decrypts data using AES/GCM/NoPadding
     */
    private String decryptData(String encryptedData) throws Exception {
        // Decode combined data
        byte[] combined = Base64.decode(encryptedData, Base64.DEFAULT);
        
        // Extract IV and encrypted data
        ByteBuffer byteBuffer = ByteBuffer.wrap(combined);
        
        // GCM typically uses 12 bytes for IV
        byte[] iv = new byte[12];
        byteBuffer.get(iv);
        
        // Get remaining bytes as ciphertext
        byte[] encryptedBytes = new byte[byteBuffer.remaining()];
        byteBuffer.get(encryptedBytes);
        
        // Create cipher
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        
        // Create secret key from hardcoded bytes
        SecretKeySpec secretKeySpec = new SecretKeySpec(ENCRYPTION_KEY, "AES");
        
        // Create GCM parameter spec with IV
        GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(128, iv);
        
        // Initialize cipher for decryption
        cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, gcmParameterSpec);
        
        // Decrypt data
        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
        
        // Return decrypted string
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
    
    /**
     * Save a credential to SharedPreferences with encryption
     */
    public void saveCredential(FragmentActivity activity, final Credential credential,
                              final CryptoOperationCallback callback) {
        try {
            Log.d(TAG, "Saving credential for: " + credential.getService());
            
            // Get current credentials from SharedPreferences
            SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
            String encryptedCredentialsJson = prefs.getString(CREDENTIALS_KEY, null);
            
            List<Credential> credentials;
            if (encryptedCredentialsJson != null) {
                // Decrypt and parse existing credentials
                String decryptedJson = decryptData(encryptedCredentialsJson);
                credentials = parseCredentialsFromJson(decryptedJson);
            } else {
                // No existing credentials
                credentials = new ArrayList<>();
            }
            
            // Add new credential
            credentials.add(credential);
            
            // Convert to JSON
            String jsonData = credentialsToJson(credentials);
            
            // Encrypt
            String encryptedJson = encryptData(jsonData);
            
            // Save encrypted data
            prefs.edit().putString(CREDENTIALS_KEY, encryptedJson).apply();
            
            callback.onSuccess("Credential saved successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error saving credential", e);
            callback.onError(e);
        }
    }
    
    /**
     * Get all credentials from SharedPreferences with decryption
     */
    public void getAllCredentials(FragmentActivity activity, final CryptoOperationCallback callback) {
        try {
            Log.d(TAG, "Retrieving credentials from SharedPreferences");
            
            // Get encrypted credentials from SharedPreferences
            SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
            String encryptedCredentialsJson = prefs.getString(CREDENTIALS_KEY, null);
            
            if (encryptedCredentialsJson == null) {
                // No credentials found
                callback.onSuccess(new JSONArray().toString());
                return;
            }
            
            // Decrypt credentials
            String decryptedJson = decryptData(encryptedCredentialsJson);
            
            callback.onSuccess(decryptedJson);
        } catch (Exception e) {
            Log.e(TAG, "Error retrieving credentials", e);
            callback.onError(e);
        }
    }
    
    /**
     * Clear all credentials from SharedPreferences
     */
    public void clearAllData() {
        Log.d(TAG, "Clearing all credentials from SharedPreferences");
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .remove(CREDENTIALS_KEY)
            .apply();
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
