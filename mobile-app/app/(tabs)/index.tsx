import { Image, StyleSheet, Platform, Button, View, FlatList, Text, SafeAreaView, AppState, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeModules } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Buffer } from 'buffer';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDb } from '@/context/DbContext';
import { useAuth } from '@/context/AuthContext';
import { SrpUtility } from '@/utils/SrpUtility';
import EncryptionUtility from '@/utils/EncryptionUtility';
import { ApiAuthError } from '@/utils/types/errors/ApiAuthError';
import { useWebApi } from '@/context/WebApiContext';
import { Credential } from '@/utils/types/Credential';
export default function HomeScreen() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loginResponse, setLoginResponse] = useState<any>(null);
  const [passwordHashString, setPasswordHashString] = useState<string | null>(null);
  const [passwordHashBase64, setPasswordHashBase64] = useState<string | null>(null);

  const appState = useRef(AppState.currentState);
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();

  const srpUtil = new SrpUtility(webApi);

  // Initialization state.
  const isFullyInitialized = authContext.isInitialized && dbContext.dbInitialized;
  const isAuthenticated = authContext.isLoggedIn;
  const isDatabaseAvailable = dbContext.dbAvailable;
  const requireLoginOrUnlock = isFullyInitialized && (!isAuthenticated || !isDatabaseAvailable);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('handleSubmit');
      // Clear global message if set with every login attempt.
      authContext.clearGlobalMessage();

      // Use the srpUtil instance instead of the imported singleton
      const loginResponse = await srpUtil.initiateLogin(credentials.username);

      console.log('loginResponse', loginResponse);

      // 1. Derive key from password using Argon2id
      const passwordHash = await EncryptionUtility.deriveKeyFromPassword(
        credentials.password,
        loginResponse.salt,
        loginResponse.encryptionType,
        loginResponse.encryptionSettings
      );

      console.log('passwordHash', passwordHash);

      // Convert uint8 array to uppercase hex string which is expected by the server.
      const passwordHashString = Buffer.from(passwordHash).toString('hex').toUpperCase();

      // Get the derived key as base64 string required for decryption.
      const passwordHashBase64 = Buffer.from(passwordHash).toString('base64');

      console.log('passwordHashString', passwordHashString);

      // 2. Validate login with SRP protocol
      const validationResponse = await srpUtil.validateLogin(
        credentials.username,
        passwordHashString,
        rememberMe,
        loginResponse
      );

      console.log('validationResponse', validationResponse);

      // 3. Handle 2FA if required
      if (validationResponse.requiresTwoFactor) {
        // Store login response as we need it for 2FA validation
        setLoginResponse(loginResponse);
        // Store password hash string as we need it for 2FA validation
        setPasswordHashString(passwordHashString);
        // Store password hash base64 as we need it for decryption
        setPasswordHashBase64(passwordHashBase64);
        setTwoFactorRequired(true);
        setIsLoading(false);
        return;
      }

      // Check if token was returned.
      if (!validationResponse.token) {
        throw new Error('Login failed -- no token returned');
      }

      console.log('validationResponse.token', validationResponse.token);

      // Try to get latest vault manually providing auth token.
      const vaultResponseJson = await webApi.authFetch<any>('Vault', { method: 'GET', headers: {
        'Authorization': `Bearer ${validationResponse.token.token}`
      } });

      console.log('vaultResponseJson', vaultResponseJson);

      const vaultError = webApi.validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        console.error('vaultError', vaultError);
        setError(vaultError);
        setIsLoading(false);
        return;
      }

      console.log('vaultResponseJson', vaultResponseJson);

      // All is good. Store auth info which is required to make requests to the web API.
      await authContext.setAuthTokens(credentials.username, validationResponse.token.token, validationResponse.token.refreshToken);

      console.log('auth tokens set');
      // Initialize the SQLite context with the new vault data.
      await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);

      console.log('database initialized');

      // Set logged in status to true which refreshes the app.
      await authContext.login();

      console.log('logged in');

      setIsLoading(false);
    } catch (err) {
      // Show API authentication errors as-is.
      if (err instanceof ApiAuthError) {
        console.error('ApiAuthError error:', err);
        setError(err.message);
      } else {
        console.error('Login error:', err);
        setError('Could not reach AliasVault server. Please try again later or contact support if the problem persists.');
      }
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!passwordHashString || !passwordHashBase64 || !loginResponse) {
        throw new Error('Required login data not found');
      }

      // Validate that 2FA code is a 6-digit number
      const code = twoFactorCode.trim();
      if (!/^\d{6}$/.test(code)) {
        throw new ApiAuthError('Please enter a valid 6-digit authentication code.');
      }

      const validationResponse = await srpUtil.validateLogin2Fa(
        credentials.username,
        passwordHashString,
        rememberMe,
        loginResponse,
        parseInt(twoFactorCode)
      );

      // Check if token was returned.
      if (!validationResponse.token) {
        throw new Error('Login failed -- no token returned');
      }

      // Try to get latest vault manually providing auth token.
      const vaultResponseJson = await webApi.authFetch<any>('Vault', { method: 'GET', headers: {
        'Authorization': `Bearer ${validationResponse.token.token}`
      } });

      const vaultError = webApi.validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        setError(vaultError);
        setIsLoading(false);
        return;
      }

      // All is good. Store auth info which is required to make requests to the web API.
      await authContext.setAuthTokens(credentials.username, validationResponse.token.token, validationResponse.token.refreshToken);

      // Initialize the SQLite context with the new vault data.
      await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);

      // Set logged in status to true which refreshes the app.
      await authContext.login();

      // Reset 2FA state and login response as it's no longer needed
      setTwoFactorRequired(false);
      setTwoFactorCode('');
      setPasswordHashString(null);
      setPasswordHashBase64(null);
      setLoginResponse(null);
      setIsLoading(false);
    } catch (err) {
      // Show API authentication errors as-is.
      console.error('2FA error:', err);
      if (err instanceof ApiAuthError) {
        setError(err.message);
      } else {
        console.error('2FA error:', err);
        setError('Could not reach AliasVault server. Please try again later or contact support if the problem persists.');
      }
      setIsLoading(false);
    }
  };


  const [credentialsList, setCredentialsList] = useState<Credential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isDatabaseAvailable) {
      return;
    }

    const loadCredentials = async () => {
      setIsLoadingCredentials(true);
      try {
        const credentialsList = await dbContext.sqliteClient!.getAllCredentials();
        console.log('credentialsList', credentialsList);
        setCredentialsList(credentialsList);
      } catch (err) {
        console.error('Error loading credentials:', err);
      }
      setIsLoadingCredentials(false);
    };

    loadCredentials();
  }, [isAuthenticated, isDatabaseAvailable]);
  
  if (!isAuthenticated || !isDatabaseAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">AliasVault</ThemedText>
          </ThemedView>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {twoFactorRequired ? (
            <View style={styles.formContainer}>
              <Text style={styles.label}>Authentication Code</Text>
              <TextInput
                style={styles.input}
                value={twoFactorCode}
                onChangeText={setTwoFactorCode}
                placeholder="Enter 6-digit code"
                keyboardType="numeric"
                maxLength={6}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleTwoFactorSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => {
                    setCredentials({ username: '', password: '' });
                    setTwoFactorRequired(false);
                    setTwoFactorCode('');
                    setPasswordHashString(null);
                    setPasswordHashBase64(null);
                    setLoginResponse(null);
                    setError(null);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.noteText}>
                Note: if you don't have access to your authenticator device, you can reset your 2FA with a recovery code by logging in via the website.
              </Text>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.label}>Username or email</Text>
              <TextInput
                style={styles.input}
                value={credentials.username}
                onChangeText={(text) => setCredentials({ ...credentials, username: text })}
                placeholder="name / name@company.com"
                autoCapitalize="none"
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={credentials.password}
                onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                placeholder="Enter your password"
                secureTextEntry
              />
              <View style={styles.rememberMeContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkboxInner, rememberMe && styles.checkboxChecked]} />
                </TouchableOpacity>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">AliasVault</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Your Credentials</ThemedText>
          {isLoadingCredentials ? (
            <ActivityIndicator size="large" color="#f97316" />
          ) : (
            <FlatList
              data={credentialsList}
              keyExtractor={(item) => item.Id}
              renderItem={({ item }) => (
                <View style={styles.credentialItem}>
                  <Text style={styles.serviceName}>{item.ServiceName ?? 'Unknown Service'}</Text>
                  {item.Username && <Text style={styles.credentialText}>Username: {item.Username}</Text>}
                  {item.Alias?.Email && <Text style={styles.credentialText}>Email: {item.Alias.Email}</Text>}
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No credentials found</Text>
              }
            />
          )}
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stepContainer: {
    flex: 1,
    gap: 8,
  },
  formContainer: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    gap: 8,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#f97316',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#f97316',
  },
  rememberMeText: {
    fontSize: 14,
  },
  noteText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
  logoutButton: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  credentialItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  credentialText: {
    fontSize: 14,
    color: '#4b5563',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 24,
  },
});
