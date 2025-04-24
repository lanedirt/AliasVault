import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator, Linking, Animated } from 'react-native';
import { useState, useEffect } from 'react';
import { Buffer } from 'buffer';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/ThemedView';
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
import { MaterialIcons } from '@expo/vector-icons';


export default function LoginScreen() {
  const colors = useColors();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [apiUrl, setApiUrl] = useState<string>(AppInfo.DEFAULT_API_URL);

  const loadApiUrl = async () => {
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
  }, []);

  // Update URL when returning from settings
  useFocusEffect(() => {
    loadApiUrl();
  });

  const getDisplayUrl = () => {
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
  const [loginResponse, setLoginResponse] = useState<any>(null);
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
    vaultResponseJson: any,
    passwordHashBase64: string
  ) => {
    await authContext.setAuthTokens(credentials.username, token, refreshToken);
    await dbContext.initializeDatabase(vaultResponseJson, passwordHashBase64);
    await authContext.login();

    setTwoFactorRequired(false);
    setTwoFactorCode('');
    setPasswordHashString(null);
    setPasswordHashBase64(null);
    setLoginResponse(null);
    setLoginStatus(null);
    router.replace('/(tabs)');
    setIsLoading(false);
  };

  const handleSubmit = async () => {
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
      const vaultResponseJson = await webApi.authFetch<any>('Vault', { method: 'GET', headers: {
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

  const handleTwoFactorSubmit = async () => {
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
      const vaultResponseJson = await webApi.authFetch<any>('Vault', { method: 'GET', headers: {
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
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerSection: {
      backgroundColor: colors.loginHeader,
      paddingTop: 24,
      paddingBottom: 24,
      paddingHorizontal: 16,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 8,
    },
    appName: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
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
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      borderWidth: 1,
      borderColor: colors.accentBorder,
      borderRadius: 8,
      marginBottom: 16,
      backgroundColor: colors.accentBackground,
    },
    inputIcon: {
      padding: 10,
    },
    input: {
      flex: 1,
      height: 45,
      paddingHorizontal: 4,
      fontSize: 16,
      color: colors.text,
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
      fontSize: 14,
      textAlign: 'center',
      marginTop: 16,
      color: colors.textMuted,
    },
    headerContainer: {
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
    },
    clickableDomain: {
      color: colors.primary,
      textDecorationLine: 'underline',
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
          <LoadingIndicator status={loginStatus || 'Loading...'} />
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
                <Text style={[styles.label]}>Authentication Code</Text>
                <TextInput
                  style={[styles.input]}
                  value={twoFactorCode}
                  onChangeText={setTwoFactorCode}
                  autoCorrect={false}
                  autoCapitalize="none"
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
                <Text style={[styles.label]}>Password</Text>
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
                <Text style={[styles.noteText]}>
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