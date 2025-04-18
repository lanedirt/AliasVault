import { StyleSheet, View, Text, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
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
import { useColors } from '@/hooks/useColorScheme';

export default function LoginScreen() {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
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
      backgroundColor: colors.errorBackground,
      borderColor: colors.errorBorder,
      borderWidth: 1,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: colors.errorText,
      fontSize: 14,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      borderColor: colors.accentBorder,
      color: colors.text,
      backgroundColor: colors.accentBackground,
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
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
    },
    buttonText: {
      color: colors.text,
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
      borderColor: colors.accentBorder,
    },
    checkboxInner: {
      width: 12,
      height: 12,
      borderRadius: 2,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
    },
    rememberMeText: {
      fontSize: 14,
      color: colors.text,
    },
    noteText: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 16,
      color: colors.textMuted,
    },
  });

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
            <Text style={[styles.label]}>Authentication Code</Text>
            <TextInput
              style={[styles.input]}
              value={twoFactorCode}
              onChangeText={setTwoFactorCode}
              placeholder="Enter 6-digit code"
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleTwoFactorSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.text} />
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
            <Text style={[styles.noteText]}>
              Note: if you don't have access to your authenticator device, you can reset your 2FA with a recovery code by logging in via the website.
            </Text>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={[styles.label]}>Username or email</Text>
            <TextInput
              style={[styles.input]}
              value={credentials.username}
              onChangeText={(text) => setCredentials({ ...credentials, username: text })}
              placeholder="name / name@company.com"
              autoCapitalize="none"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.label]}>Password</Text>
            <TextInput
              style={[styles.input]}
              value={credentials.password}
              onChangeText={(text) => setCredentials({ ...credentials, password: text })}
              placeholder="Enter your password"
              secureTextEntry
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.rememberMeContainer}>
              <TouchableOpacity
                style={[styles.checkbox]}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkboxInner, rememberMe && styles.checkboxChecked]} />
              </TouchableOpacity>
              <Text style={[styles.rememberMeText]}>Remember me</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} />
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