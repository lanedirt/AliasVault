package net.aliasvault.app.credentialmanager;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;
import java.nio.ByteBuffer;
import java.security.KeyStore;
import java.security.SecureRandom;

import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class SharedCredentialStore {
    private static final String TAG = "SharedCredentialStore";
    private static final String SHARED_PREFS_NAME = "net.aliasvault.credentials";
    private static final String CREDENTIALS_KEY = "stored_credentials";
    private static final String KEYSTORE_ALIAS = "net.aliasvault.encryption_key";
    private static final String ENCRYPTED_KEY_PREF = "encrypted_key";

    private static SharedCredentialStore instance;
    private final Context appContext;

    // Cache for encryption key during the lifetime of this instance
    private byte[] encryptionKey;
    private final Executor executor;

    // Interface for operations that need callbacks
    public interface CryptoOperationCallback {
        void onSuccess(String result);
        void onError(Exception e);
    }

    private SharedCredentialStore(Context context) {
        this.appContext = context.getApplicationContext();
        this.executor = Executors.newSingleThreadExecutor();
    }

    public static synchronized SharedCredentialStore getInstance(Context context) {
        if (instance == null) {
            instance = new SharedCredentialStore(context);
        }
        return instance;
    }

    /**
     * Get or create encryption key using biometric authentication
     */
    public void getEncryptionKey(FragmentActivity activity, final CryptoOperationCallback callback) {
        // If key is already in memory, use it
        if (encryptionKey != null) {
            Log.d(TAG, "Using cached encryption key");
            callback.onSuccess("Key available");
            return;
        }

        // Check if we have a stored key
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        String encryptedKeyB64 = prefs.getString(ENCRYPTED_KEY_PREF, null);

        if (encryptedKeyB64 == null) {
            // No key exists, create a new one
            createNewEncryptionKey(activity, callback);
        } else {
            // Key exists, retrieve it with biometric auth
            retrieveEncryptionKey(activity, encryptedKeyB64, callback);
        }
    }

    /**
     * Create a new random encryption key and protect it with biometrics
     */
    private void createNewEncryptionKey(FragmentActivity activity, final CryptoOperationCallback callback) {
        try {
            // Generate a random 32-byte key for AES-256
            SecureRandom secureRandom = new SecureRandom();
            byte[] randomKey = new byte[32];
            secureRandom.nextBytes(randomKey);

            // Cache the key
            encryptionKey = randomKey;

            // Store the key protected by biometric authentication
            storeKeyWithBiometricProtection(activity, randomKey, callback);
        } catch (Exception e) {
            Log.e(TAG, "Error creating encryption key", e);
            callback.onError(e);
        }
    }

    /**
     * Store the encryption key protected by biometric authentication
     */
    private void storeKeyWithBiometricProtection(FragmentActivity activity, final byte[] keyToStore,
                                                final CryptoOperationCallback callback) {
        try {
            // Set up KeyStore
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            // Create or get biometric key
            if (!keyStore.containsAlias(KEYSTORE_ALIAS)) {
                KeyGenerator keyGenerator = KeyGenerator.getInstance(
                        KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");

                KeyGenParameterSpec keySpec = new KeyGenParameterSpec.Builder(
                        KEYSTORE_ALIAS,
                        KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setUserAuthenticationRequired(true)
                        .build();

                keyGenerator.init(keySpec);
                keyGenerator.generateKey();
            }

            // Get the created key
            final SecretKey secretKey = (SecretKey) keyStore.getKey(KEYSTORE_ALIAS, null);

            // Create BiometricPrompt
            BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle("Remember AliasVault password")
                    .setSubtitle("Protect your AliasVault decryption key with your biometrics.")
                    .setNegativeButtonText("Cancel")
                    .build();

            BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor,
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                            try {
                                // Get the cipher from the result
                                Cipher cipher = result.getCryptoObject().getCipher();

                                // Encrypt the key
                                byte[] encryptedKey = cipher.doFinal(keyToStore);
                                byte[] iv = cipher.getIV();

                                // Combine IV and encrypted key
                                ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encryptedKey.length);
                                byteBuffer.put(iv);
                                byteBuffer.put(encryptedKey);
                                byte[] combined = byteBuffer.array();

                                // Store encrypted key in SharedPreferences
                                String encryptedKeyB64 = Base64.encodeToString(combined, Base64.DEFAULT);
                                SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
                                prefs.edit().putString(ENCRYPTED_KEY_PREF, encryptedKeyB64).apply();

                                Log.d(TAG, "Encryption key stored successfully");
                                callback.onSuccess("Key stored successfully");
                            } catch (Exception e) {
                                Log.e(TAG, "Error storing encryption key", e);
                                callback.onError(e);
                            }
                        }

                        @Override
                        public void onAuthenticationError(int errorCode, CharSequence errString) {
                            Log.e(TAG, "Authentication error: " + errString);
                            callback.onError(new Exception("Authentication error: " + errString));
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            Log.e(TAG, "Authentication failed");
                        }
                    });

            // Initialize cipher for encryption
            Cipher cipher = Cipher.getInstance(KeyProperties.KEY_ALGORITHM_AES + "/"
                    + KeyProperties.BLOCK_MODE_GCM + "/"
                    + KeyProperties.ENCRYPTION_PADDING_NONE);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);

            // Show biometric prompt
            biometricPrompt.authenticate(promptInfo, new BiometricPrompt.CryptoObject(cipher));

        } catch (Exception e) {
            Log.e(TAG, "Error in biometric key storage", e);
            callback.onError(e);
        }
    }

    /**
     * Retrieve the encryption key using biometric authentication
     */
    private void retrieveEncryptionKey(FragmentActivity activity, final String encryptedKeyB64,
                                      final CryptoOperationCallback callback) {
        try {
            // Set up KeyStore
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            // Check if key exists
            if (!keyStore.containsAlias(KEYSTORE_ALIAS)) {
                Log.e(TAG, "Keystore key not found");
                createNewEncryptionKey(activity, callback);
                return;
            }

            // Get the key
            final SecretKey secretKey = (SecretKey) keyStore.getKey(KEYSTORE_ALIAS, null);

            // Create BiometricPrompt
            BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle("Unlock Vault")
                    .setSubtitle("Unlock your protected AliasVault contents")
                    .setNegativeButtonText("Cancel")
                    .build();

            BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor,
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                            try {
                                // Get the cipher from the result
                                Cipher cipher = result.getCryptoObject().getCipher();

                                // Decode combined data
                                byte[] combined = Base64.decode(encryptedKeyB64, Base64.DEFAULT);

                                // Extract IV and encrypted data
                                ByteBuffer byteBuffer = ByteBuffer.wrap(combined);

                                // GCM typically uses 12 bytes for IV
                                byte[] iv = new byte[12];
                                byteBuffer.get(iv);

                                // Get remaining bytes as ciphertext
                                byte[] encryptedBytes = new byte[byteBuffer.remaining()];
                                byteBuffer.get(encryptedBytes);

                                // Decrypt the key
                                byte[] decryptedKey = cipher.doFinal(encryptedBytes);

                                // Cache the key
                                encryptionKey = decryptedKey;

                                Log.d(TAG, "Encryption key retrieved successfully");
                                callback.onSuccess("Key retrieved successfully");
                            } catch (Exception e) {
                                Log.e(TAG, "Error retrieving encryption key", e);
                                callback.onError(e);
                            }
                        }

                        @Override
                        public void onAuthenticationError(int errorCode, CharSequence errString) {
                            Log.e(TAG, "Authentication error: " + errString);
                            callback.onError(new Exception("Authentication error: " + errString));
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            Log.e(TAG, "Authentication failed");
                        }
                    });

            // Initialize cipher for decryption with IV from stored encrypted key
            byte[] combined = Base64.decode(encryptedKeyB64, Base64.DEFAULT);
            ByteBuffer byteBuffer = ByteBuffer.wrap(combined);
            byte[] iv = new byte[12];
            byteBuffer.get(iv);

            Cipher cipher = Cipher.getInstance(KeyProperties.KEY_ALGORITHM_AES + "/"
                    + KeyProperties.BLOCK_MODE_GCM + "/"
                    + KeyProperties.ENCRYPTION_PADDING_NONE);
            GCMParameterSpec spec = new GCMParameterSpec(128, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            // Show biometric prompt
            biometricPrompt.authenticate(promptInfo, new BiometricPrompt.CryptoObject(cipher));

        } catch (Exception e) {
            Log.e(TAG, "Error in biometric key retrieval", e);
            callback.onError(e);
        }
    }

    /**
     * Encrypts data using AES/GCM/NoPadding
     */
    private String encryptData(String plaintext) throws Exception {
        if (encryptionKey == null) {
            throw new Exception("Encryption key not available");
        }

        // Create cipher
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");

        // Create secret key from retrieved bytes
        SecretKeySpec secretKeySpec = new SecretKeySpec(encryptionKey, "AES");

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
        if (encryptionKey == null) {
            throw new Exception("Encryption key not available");
        }

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

        // Create secret key from retrieved bytes
        SecretKeySpec secretKeySpec = new SecretKeySpec(encryptionKey, "AES");

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
        // First ensure we have the encryption key
        getEncryptionKey(activity, new CryptoOperationCallback() {
            @Override
            public void onSuccess(String result) {
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

            @Override
            public void onError(Exception e) {
                Log.e(TAG, "Failed to get encryption key", e);
                callback.onError(e);
            }
        });
    }

    /**
     * Get all credentials from SharedPreferences with decryption
     */
    public void getAllCredentials(FragmentActivity activity, final CryptoOperationCallback callback) {
        // First check if credentials exist
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        String encryptedCredentialsJson = prefs.getString(CREDENTIALS_KEY, null);
        
        if (encryptedCredentialsJson == null) {
            // No credentials found, return empty array without triggering biometric authentication
            Log.d(TAG, "No credentials found, returning empty array without key retrieval");
            callback.onSuccess(new JSONArray().toString());
            return;
        }
        
        // Credentials exist, ensure we have the encryption key
        getEncryptionKey(activity, new CryptoOperationCallback() {
            @Override
            public void onSuccess(String result) {
                try {
                    Log.d(TAG, "Retrieving credentials from SharedPreferences");
                    
                    // Decrypt credentials
                    String decryptedJson = decryptData(encryptedCredentialsJson);
                    
                    callback.onSuccess(decryptedJson);
                } catch (Exception e) {
                    Log.e(TAG, "Error retrieving credentials", e);
                    callback.onError(e);
                }
            }
            
            @Override
            public void onError(Exception e) {
                Log.e(TAG, "Failed to get encryption key", e);
                callback.onError(e);
            }
        });
    }

    /**
     * Clear all credentials from SharedPreferences
     */
    public void clearAllData() {
        Log.d(TAG, "Clearing all credentials from SharedPreferences");
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .remove(CREDENTIALS_KEY)
            .remove(ENCRYPTED_KEY_PREF)
            .apply();
            
        // Clear the cached encryption key
        encryptionKey = null;
        
        // Remove the key from Android Keystore if it exists
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            
            if (keyStore.containsAlias(KEYSTORE_ALIAS)) {
                keyStore.deleteEntry(KEYSTORE_ALIAS);
                Log.d(TAG, "Removed encryption key from Android Keystore");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error removing encryption key from Keystore", e);
        }
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
