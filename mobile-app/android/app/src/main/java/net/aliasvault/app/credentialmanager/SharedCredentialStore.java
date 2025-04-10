package net.aliasvault.app.credentialmanager;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.fragment.app.FragmentActivity;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class SharedCredentialStore {
    private static final String TAG = "SharedCredentialStore";
    private static final String SHARED_PREFS_NAME = "net.aliasvault.credentials";
    private static final String CREDENTIALS_KEY = "stored_credentials";

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
     * Save a credential to SharedPreferences
     */
    public void saveCredential(FragmentActivity activity, final Credential credential,
                              final CryptoOperationCallback callback) {
        try {
            Log.d(TAG, "Saving credential for: " + credential.getService());

            // Get current credentials from SharedPreferences
            SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
            String storedCredentialsJson = prefs.getString(CREDENTIALS_KEY, "[]");

            // Parse existing credentials
            List<Credential> credentials = parseCredentialsFromJson(storedCredentialsJson);

            // Add new credential
            credentials.add(credential);

            // Save updated credentials
            String updatedJsonData = credentialsToJson(credentials);
            prefs.edit().putString(CREDENTIALS_KEY, updatedJsonData).apply();

            callback.onSuccess("Credential saved successfully");
        } catch (Exception e) {
            callback.onError(e);
        }
    }

    /**
     * Get all credentials from SharedPreferences
     */
    public void getAllCredentials(FragmentActivity activity, final CryptoOperationCallback callback) {
        try {
            Log.d(TAG, "Retrieving credentials from SharedPreferences");

            // Get credentials from SharedPreferences
            SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
            String storedCredentialsJson = prefs.getString(CREDENTIALS_KEY, "[]");

            callback.onSuccess(storedCredentialsJson);
        } catch (Exception e) {
            callback.onError(e);
        }
    }

    /**
     * Clear all credentials from SharedPreferences
     */
    public void clearAllData() {
        Log.d(TAG, "Clearing all credentials from SharedPreferences");
        SharedPreferences prefs = appContext.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(CREDENTIALS_KEY).apply();
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
