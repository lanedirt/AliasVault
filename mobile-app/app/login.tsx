import { StyleSheet, Platform, View, Text, SafeAreaView, AppState, TextInput, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Buffer } from 'buffer';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDb } from '@/context/DbContext';
import { useAuth } from '@/context/AuthContext';
import { SrpUtility } from '@/utils/SrpUtility';
import EncryptionUtility from '@/utils/EncryptionUtility';
import { ApiAuthError } from '@/utils/types/errors/ApiAuthError';
import { useWebApi } from '@/context/WebApiContext';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const dynamicStyles = {
    input: {
      borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
    },
    label: {
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
    },
    checkbox: {
      borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
    },
    rememberMeText: {
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
    },
    noteText: {
      color: isDarkMode ? '#9ca3af' : '#6b7280',
    },
  };

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

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('handleSubmit');
      authContext.clearGlobalMessage();

      const loginResponse = await srpUtil.initiateLogin(credentials.username);

      console.log('loginResponse', loginResponse);

      const passwordHash = await EncryptionUtility.deriveKeyFromPassword(
        credentials.password,
        loginResponse.salt,
        loginResponse.encryptionType,
        loginResponse.encryptionSettings
      );

      console.log('passwordHash', passwordHash);

      const passwordHashString = Buffer.from(passwordHash).toString('hex').toUpperCase();
      const passwordHashBase64 = Buffer.from(passwordHash).toString('base64');

      console.log('passwordHashString', passwordHashString);

      const validationResponse = await srpUtil.validateLogin(
        credentials.username,
        passwordHashString,
        rememberMe,
        loginResponse
      );

      console.log('validationResponse', validationResponse);

      if (validationResponse.requiresTwoFactor) {
        setLoginResponse(loginResponse);
        setPasswordHashString(passwordHashString);
        setPasswordHashBase64(passwordHashBase64);
        setTwoFactorRequired(true);
        setIsLoading(false);
        return;
      }

      if (!validationResponse.token) {
        throw new Error('Login failed -- no token returned');
      }

      console.log('validationResponse.token', validationResponse.token);

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

      await authContext.setAuthTokens(credentials.username, validationResponse.token.token, validationResponse.token.refreshToken);
      await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);
      await authContext.login();

      console.log('logged in');
      router.replace('/(tabs)');

      setIsLoading(false);
    } catch (err) {
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

      if (!validationResponse.token) {
        throw new Error('Login failed -- no token returned');
      }

      const vaultResponseJson = await webApi.authFetch<any>('Vault', { method: 'GET', headers: {
        'Authorization': `Bearer ${validationResponse.token.token}`
      } });

      const vaultError = webApi.validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        setError(vaultError);
        setIsLoading(false);
        return;
      }

      await authContext.setAuthTokens(credentials.username, validationResponse.token.token, validationResponse.token.refreshToken);
      await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);
      await authContext.login();

      setTwoFactorRequired(false);
      setTwoFactorCode('');
      setPasswordHashString(null);
      setPasswordHashBase64(null);
      setLoginResponse(null);
      router.replace('/(tabs)');
      setIsLoading(false);
    } catch (err) {
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
            <Text style={[styles.label, dynamicStyles.label]}>Authentication Code</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={twoFactorCode}
              onChangeText={setTwoFactorCode}
              placeholder="Enter 6-digit code"
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
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
            <Text style={[styles.noteText, dynamicStyles.noteText]}>
              Note: if you don't have access to your authenticator device, you can reset your 2FA with a recovery code by logging in via the website.
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={[styles.label, dynamicStyles.label]}>Username or email</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={credentials.username}
              onChangeText={(text) => setCredentials({ ...credentials, username: text })}
              placeholder="name / name@company.com"
              autoCapitalize="none"
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            />
            <Text style={[styles.label, dynamicStyles.label]}>Password</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={credentials.password}
              onChangeText={(text) => setCredentials({ ...credentials, password: text })}
              placeholder="Enter your password"
              secureTextEntry
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
            />
            <View style={styles.rememberMeContainer}>
              <TouchableOpacity
                style={[styles.checkbox, dynamicStyles.checkbox]}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkboxInner, rememberMe && styles.checkboxChecked]} />
              </TouchableOpacity>
              <Text style={[styles.rememberMeText, dynamicStyles.rememberMeText]}>Remember me</Text>
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
    textAlign: 'center',
    marginTop: 16,
  },
});