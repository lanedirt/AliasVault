import { Buffer } from 'buffer';

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Linking, Animated } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedView } from '@/components/themed/ThemedView';
import { useDb } from '@/context/DbContext';
import { useAuth } from '@/context/AuthContext';
import { SrpUtility } from '@/utils/SrpUtility';
import EncryptionUtility from '@/utils/EncryptionUtility';
import { ApiAuthError } from '@/utils/types/errors/ApiAuthError';
import { useWebApi } from '@/context/WebApiContext';
import { useColors } from '@/hooks/useColorScheme';
import Logo from '@/assets/images/logo.svg';
import { AppInfo } from '@/utils/AppInfo';
import LoadingIndicator from '@/components/LoadingIndicator';
import { LoginResponse } from '@/utils/types/webapi/Login';
import { VaultResponse } from '@/utils/types/webapi/VaultResponse';

/**
 * Login screen.
 */
export default function LoginScreen() : React.ReactNode {
  const colors = useColors();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [apiUrl, setApiUrl] = useState<string>(AppInfo.DEFAULT_API_URL);

  /**
   * Load the API URL.
   */
  const loadApiUrl = async () : Promise<void> => {
    const storedUrl = await AsyncStorage.getItem('apiUrl');
    if (storedUrl && storedUrl.length > 0) {
      setApiUrl(storedUrl);
    } else {
      setApiUrl(AppInfo.DEFAULT_API_URL);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    loadApiUrl();
  }, [fadeAnim]);

  // Update URL when returning from settings
  useFocusEffect(() => {
    loadApiUrl();
  });

  /**
   * Get the display URL.
   */
  const getDisplayUrl = () : string => {
    const cleanUrl = apiUrl.replace('https://', '').replace('/api', '');
    return cleanUrl === 'app.aliasvault.net' ? 'aliasvault.net' : cleanUrl;
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
  const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(null);
  const [passwordHashString, setPasswordHashString] = useState<string | null>(null);
  const [passwordHashBase64, setPasswordHashBase64] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<string | null>(null);

  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();

  const srpUtil = new SrpUtility(webApi);

  /**
   * Process the vault response by storing the vault and logging in the user.
   * @param token - The token to use for the vault
   * @param refreshToken - The refresh token to use for the vault
   * @param vaultResponseJson - The vault response
   * @param passwordHashBase64 - The password hash base64
   */
  const processVaultResponse = async (
    token: string,
    refreshToken: string,
    vaultResponseJson: VaultResponse,
    passwordHashBase64: string
  ) : Promise<void> => {
    await authContext.setAuthTokens(credentials.username, token, refreshToken);
    await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);
    await authContext.login();

    setTwoFactorRequired(false);
    setTwoFactorCode('');
    setPasswordHashString(null);
    setPasswordHashBase64(null);
    setLoginResponse(null);
    setLoginStatus(null);
    router.replace('/(tabs)/credentials');
    setIsLoading(false);
  };

  /**
   * Handle the submit.
   */
  const handleSubmit = async () : Promise<void> => {
    setIsLoading(true);
    setError(null);

    // Sanity check: if username or password is empty, return
    if (!credentials.username || !credentials.password) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }

    setLoginStatus('Logging in');
    await new Promise(resolve => requestAnimationFrame(resolve));

    try {
      authContext.clearGlobalMessage();

      const loginResponse = await srpUtil.initiateLogin(credentials.username);

      const passwordHash = await EncryptionUtility.deriveKeyFromPassword(
        credentials.password,
        loginResponse.salt,
        loginResponse.encryptionType,
        loginResponse.encryptionSettings
      );

      const passwordHashString = Buffer.from(passwordHash).toString('hex').toUpperCase();
      const passwordHashBase64 = Buffer.from(passwordHash).toString('base64');

      setLoginStatus('Validating credentials');
      await new Promise(resolve => requestAnimationFrame(resolve));
      const validationResponse = await srpUtil.validateLogin(
        credentials.username,
        passwordHashString,
        rememberMe,
        loginResponse
      );

      if (validationResponse.requiresTwoFactor) {
        setLoginResponse(loginResponse);
        setPasswordHashString(passwordHashString);
        setPasswordHashBase64(passwordHashBase64);
        setTwoFactorRequired(true);
        setIsLoading(false);
        setLoginStatus(null);
        return;
      }

      if (!validationResponse.token) {
        throw new Error('Login failed -- no token returned');
      }

      setLoginStatus('Syncing vault');
      await new Promise(resolve => requestAnimationFrame(resolve));
      const vaultResponseJson = await webApi.authFetch<VaultResponse>('Vault', { method: 'GET', headers: {
        'Authorization': `Bearer ${validationResponse.token.token}`
      } });

      const vaultError = webApi.validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        console.error('vaultError', vaultError);
        setError(vaultError);
        setIsLoading(false);
        setLoginStatus(null);
        return;
      }

      await processVaultResponse(
        validationResponse.token.token,
        validationResponse.token.refreshToken,
        vaultResponseJson,
        passwordHashBase64
      );
    } catch (err) {
      if (err instanceof ApiAuthError) {
        console.error('ApiAuthError error:', err);
        setError(err.message);
      } else {
        console.error('Login error:', err);
        setError('Could not reach AliasVault server. Please try again later or contact support if the problem persists.');
      }
      setIsLoading(false);
      setLoginStatus(null);
    }
  };

  /**
   * Handle the two factor submit.
   */
  const handleTwoFactorSubmit = async () : Promise<void> => {
    setIsLoading(true);
    setLoginStatus('Verifying authentication code');
    setError(null);
    await new Promise(resolve => requestAnimationFrame(resolve));

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

      setLoginStatus('Syncing vault');
      await new Promise(resolve => requestAnimationFrame(resolve));
      const vaultResponseJson = await webApi.authFetch<VaultResponse>('Vault', { method: 'GET', headers: {
        'Authorization': `Bearer ${validationResponse.token.token}`
      } });

      const vaultError = webApi.validateVaultResponse(vaultResponseJson);
      if (vaultError) {
        setError(vaultError);
        setIsLoading(false);
        return;
      }

      await processVaultResponse(
        validationResponse.token.token,
        validationResponse.token.refreshToken,
        vaultResponseJson,
        passwordHashBase64
      );
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

  const styles = StyleSheet.create({
    appName: {
      color: colors.text,
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    button: {
      alignItems: 'center',
      borderRadius: 8,
      padding: 12,
    },
    buttonContainer: {
      gap: 8,
    },
    buttonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    checkbox: {
      alignItems: 'center',
      borderColor: colors.accentBorder,
      borderRadius: 4,
      borderWidth: 2,
      height: 20,
      justifyContent: 'center',
      width: 20,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
    },
    checkboxInner: {
      borderRadius: 2,
      height: 12,
      width: 12,
    },
    clickableDomain: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    content: {
      backgroundColor: colors.background,
      flex: 1,
      padding: 16,
    },
    errorContainer: {
      backgroundColor: colors.errorBackground,
      borderColor: colors.errorBorder,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 16,
      padding: 12,
    },
    errorText: {
      color: colors.errorText,
      fontSize: 14,
    },
    formContainer: {
      gap: 16,
    },
    headerContainer: {
      marginBottom: 24,
    },
    headerSection: {
      backgroundColor: colors.loginHeader,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      paddingBottom: 24,
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    headerSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    input: {
      color: colors.text,
      flex: 1,
      fontSize: 16,
      height: 45,
      paddingHorizontal: 4,
    },
    inputContainer: {
      alignItems: 'center',
      backgroundColor: colors.accentBackground,
      borderColor: colors.accentBorder,
      borderRadius: 8,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: 16,
      width: '100%',
    },
    inputIcon: {
      padding: 10,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    noteText: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 16,
      textAlign: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    rememberMeContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    rememberMeText: {
      color: colors.text,
      fontSize: 14,
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
    },
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: colors.loginHeader }}>
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <View style={styles.logoContainer}>
            <Logo width={80} height={80} />
            <Text style={styles.appName}>AliasVault</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
      <ThemedView style={styles.content}>
        {isLoading ? (
          <LoadingIndicator status={loginStatus ?? 'Loading...'} />
        ) : (
          <>
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>Log in</Text>
              <Text style={styles.headerSubtitle}>
                Connecting to{' '}
                <Text
                  style={styles.clickableDomain}
                  onPress={() => router.push('/settings')}
                >
                  {getDisplayUrl()}
                </Text>
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {twoFactorRequired ? (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Authentication Code</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="security"
                    size={24}
                    color={colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={twoFactorCode}
                    onChangeText={setTwoFactorCode}
                    autoCorrect={false}
                    autoCapitalize="none"
                    placeholder="Enter 6-digit code"
                    keyboardType="numeric"
                    maxLength={6}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
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
                <Text style={styles.noteText}>
                  Note: if you don&apos;t have access to your authenticator device, you can reset your 2FA with a recovery code by logging in via the website.
                </Text>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <Text style={styles.label}>Username or email</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="person"
                    size={24}
                    color={colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={credentials.username}
                    onChangeText={(text) => setCredentials({ ...credentials, username: text })}
                    placeholder="name / name@company.com"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="lock"
                    size={24}
                    color={colors.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={credentials.password}
                    onChangeText={(text) => setCredentials({ ...credentials, password: text })}
                    placeholder="Enter your password"
                    secureTextEntry
                    placeholderTextColor={colors.textMuted}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>
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
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.noteText}>
                  No account yet?{' '}
                  <Text
                    style={styles.clickableDomain}
                    onPress={() => Linking.openURL('https://app.aliasvault.net')}
                  >
                    Create new vault
                  </Text>
                </Text>
              </View>
            )}
          </>
        )}
      </ThemedView>
    </View>
  );
}