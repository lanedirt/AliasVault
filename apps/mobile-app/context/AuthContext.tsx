import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { router, useGlobalSearchParams, usePathname } from 'expo-router';
import { NavigationContainerRef, ParamListBase } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';

import { useDb } from '@/context/DbContext';
import NativeVaultManager from '@/specs/NativeVaultManager';

// Create a navigation reference
export const navigationRef = React.createRef<NavigationContainerRef<ParamListBase>>();

export type AuthMethod = 'faceid' | 'password';

type AuthContextType = {
  isLoggedIn: boolean;
  isInitialized: boolean;
  username: string | null;
  isOffline: boolean;
  getEnabledAuthMethods: () => Promise<AuthMethod[]>;
  isFaceIDEnabled: () => Promise<boolean>;
  setAuthTokens: (username: string, accessToken: string, refreshToken: string) => Promise<void>;
  initializeAuth: () => Promise<{ isLoggedIn: boolean; enabledAuthMethods: AuthMethod[] }>;
  login: () => Promise<void>;
  logout: (errorMessage?: string) => Promise<void>;
  globalMessage: string | null;
  clearGlobalMessage: () => void;
  setAuthMethods: (methods: AuthMethod[]) => Promise<void>;
  getAuthMethodDisplay: () => Promise<string>;
  getAutoLockTimeout: () => Promise<number>;
  setAutoLockTimeout: (timeout: number) => Promise<void>;
  getBiometricDisplayName: () => Promise<string>;
  setOfflineMode: (isOffline: boolean) => void;
  // iOS Autofill methods
  shouldShowIosAutofillReminder: boolean;
  markIosAutofillConfigured: () => Promise<void>;
  // Return URL methods
  returnUrl: { path: string; params?: object } | null;
  setReturnUrl: (url: { path: string; params?: object } | null) => void;
}

const IOS_AUTOFILL_CONFIGURED_KEY = 'ios_autofill_configured';

/**
 * Auth context.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider to provide the authentication state to the app that components can use.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [shouldShowIosAutofillReminder, setShouldShowIosAutofillReminder] = useState(false);
  const [returnUrl, setReturnUrl] = useState<{ path: string; params?: object } | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const appState = useRef(AppState.currentState);
  const dbContext = useDb();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const lastRouteRef = useRef<{ path: string, params?: object }>({ path: pathname, params });

  useEffect(() => {
    lastRouteRef.current = { path: pathname, params };
  }, [pathname, params]);

  /**
   * Get enabled auth methods from the native module
   */
  const getEnabledAuthMethods = useCallback(async (): Promise<AuthMethod[]> => {
    try {
      let methods = await NativeVaultManager.getAuthMethods() as AuthMethod[];
      // Check if Face ID is actually available despite being enabled
      if (methods.includes('faceid')) {
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          // Remove Face ID from the list of enabled auth methods
          methods = methods.filter(method => method !== 'faceid');
        }
      }
      return methods;
    } catch (error) {
      console.error('Failed to get enabled auth methods:', error);
      return ['password'];
    }
  }, []);

  /**
   * Check if Face ID is enabled based on enabled auth methods
   */
  const isFaceIDEnabled = useCallback(async (): Promise<boolean> => {
    const methods = await getEnabledAuthMethods();
    return methods.includes('faceid');
  }, [getEnabledAuthMethods]);

  /**
   * Set auth tokens in storage as part of the login process. After db is initialized, the login method should be called as well.
   */
  const setAuthTokens = useCallback(async (username: string, accessToken: string, refreshToken: string): Promise<void> => {
    await AsyncStorage.setItem('username', username);
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);

    setUsername(username);
  }, []);

  /**
   * Initialize the authentication state, called on initial load by _layout.tsx.
   * @returns object containing whether the user is logged in and enabled auth methods
   */
  const initializeAuth = useCallback(async (): Promise<{ isLoggedIn: boolean; enabledAuthMethods: AuthMethod[] }> => {
    const accessToken = await AsyncStorage.getItem('accessToken') as string;
    const refreshToken = await AsyncStorage.getItem('refreshToken') as string;
    const username = await AsyncStorage.getItem('username') as string;
    let isAuthenticated = false;
    let methods: AuthMethod[] = ['password'];

    if (accessToken && refreshToken && username) {
      setUsername(username);
      setIsLoggedIn(true);
      isAuthenticated = true;
      methods = await getEnabledAuthMethods();
    }
    setIsInitialized(true);
    return { isLoggedIn: isAuthenticated, enabledAuthMethods: methods };
  }, [getEnabledAuthMethods]);

  /**
   * Set logged in status to true which refreshes the app.
   */
  const login = useCallback(async (): Promise<void> => {
    setIsLoggedIn(true);
  }, []);

  /**
   * Logout the user and clear the auth tokens from chrome storage.
   */
  const logout = useCallback(async (errorMessage?: string): Promise<void> => {
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('authMethods');
    dbContext?.clearDatabase();

    // Set local storage global message that will be shown on the login page.
    if (errorMessage) {
      setGlobalMessage(errorMessage);
    }

    setUsername(null);
    setIsLoggedIn(false);
  }, [dbContext]);

  /**
   * Clear global message (called after displaying the message).
   */
  const clearGlobalMessage = useCallback((): void => {
    setGlobalMessage(null);
  }, []);

  /**
   * Set the authentication methods and save them to storage
   */
  const setAuthMethods = useCallback(async (methods: AuthMethod[]): Promise<void> => {
    // Ensure password is always included
    const methodsToSave = methods.includes('password') ? methods : [...methods, 'password'];

    // Update iOS credentials manager
    try {
      await NativeVaultManager.setAuthMethods(methodsToSave);
    } catch (error) {
      console.error('Failed to update iOS auth methods:', error);
    }
  }, []);

  /**
   * Get the appropriate biometric display name based on device capabilities
   */
  const getBiometricDisplayName = useCallback(async (): Promise<string> => {
    try {
      const hasFaceID = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasFaceID || !enrolled) {
        return 'Face ID / Touch ID';
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFaceIDSupport = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const hasTouchIDSupport = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

      if (hasFaceIDSupport) {
        return 'Face ID';
      } else if (hasTouchIDSupport) {
        return 'Touch ID';
      }

      return 'Face ID / Touch ID';
    } catch (error) {
      console.error('Failed to get biometric display name:', error);
      return 'Face ID / Touch ID';
    }
  }, []);

  /**
   * Get the display label for the current auth method
   * Prefers Face ID if enabled, otherwise falls back to Password
   */
  const getAuthMethodDisplay = useCallback(async (): Promise<string> => {
    const methods = await getEnabledAuthMethods();
    if (methods.includes('faceid')) {
      try {
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (isEnrolled) {
          return await getBiometricDisplayName();
        }
      } catch (error) {
        console.error('Failed to check Face ID enrollment:', error);
      }
    }
    return 'Password';
  }, [getEnabledAuthMethods, getBiometricDisplayName]);

  /**
   * Get the auto-lock timeout from the iOS credentials manager
   */
  const getAutoLockTimeout = useCallback(async (): Promise<number> => {
    try {
      return await NativeVaultManager.getAutoLockTimeout();
    } catch (error) {
      console.error('Failed to get auto-lock timeout:', error);
      return 0;
    }
  }, []);

  /**
   * Set the auto-lock timeout in the iOS credentials manager
   */
  const setAutoLockTimeout = useCallback(async (timeout: number): Promise<void> => {
    try {
      await NativeVaultManager.setAutoLockTimeout(timeout);
    } catch (error) {
      console.error('Failed to update iOS auto-lock timeout:', error);
    }
  }, []);

  /**
   * Check if the vault is unlocked.
   */
  const isVaultUnlocked = useCallback(async (): Promise<boolean> => {
    try {
      return await NativeVaultManager.isVaultUnlocked();
    } catch (error) {
      console.error('Failed to check vault status:', error);
      return false;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground
        if (!pathname?.includes('unlock') && !pathname?.includes('login')) {
          try {
            // Check if vault is unlocked.
            const isUnlocked = await isVaultUnlocked();
            if (!isUnlocked) {
              // Get current full URL including query params
              const currentRoute = lastRouteRef.current;
              if (currentRoute?.path) {
                setReturnUrl({
                  path: currentRoute.path,
                  params: currentRoute.params
                });
              }

              // Database connection failed, navigate to reinitialize flow
              router.replace('/reinitialize');
            }
          } catch {
            // Database query failed, navigate to reinitialize flow
            router.replace('/reinitialize');
          }
        }
      }
      appState.current = nextAppState;
    });

    return (): void => {
      subscription.remove();
    };
  }, [isVaultUnlocked, pathname]);

  /**
   * Load iOS Autofill state from storage
   */
  const loadIosAutofillState = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setShouldShowIosAutofillReminder(false);
      return;
    }

    const configured = await AsyncStorage.getItem(IOS_AUTOFILL_CONFIGURED_KEY);
    setShouldShowIosAutofillReminder(configured !== 'true');
  }, []);

  /**
   * Mark iOS Autofill as configured
   */
  const markIosAutofillConfigured = useCallback(async () => {
    await AsyncStorage.setItem(IOS_AUTOFILL_CONFIGURED_KEY, 'true');
    setShouldShowIosAutofillReminder(false);
  }, []);

  // Load iOS Autofill state on mount
  useEffect(() => {
    loadIosAutofillState();
  }, [loadIosAutofillState]);

  const contextValue = useMemo(() => ({
    isLoggedIn,
    isInitialized,
    username,
    globalMessage,
    shouldShowIosAutofillReminder,
    returnUrl,
    isOffline,
    getEnabledAuthMethods,
    isFaceIDEnabled,
    setAuthTokens,
    initializeAuth,
    login,
    logout,
    clearGlobalMessage,
    setAuthMethods,
    getAuthMethodDisplay,
    getAutoLockTimeout,
    setAutoLockTimeout,
    getBiometricDisplayName,
    markIosAutofillConfigured,
    setReturnUrl,
    setOfflineMode: setIsOffline,
  }), [
    isLoggedIn,
    isInitialized,
    username,
    globalMessage,
    shouldShowIosAutofillReminder,
    returnUrl,
    isOffline,
    getEnabledAuthMethods,
    isFaceIDEnabled,
    setAuthTokens,
    initializeAuth,
    login,
    logout,
    clearGlobalMessage,
    setAuthMethods,
    getAuthMethodDisplay,
    getAutoLockTimeout,
    setAutoLockTimeout,
    getBiometricDisplayName,
    markIosAutofillConfigured,
    setReturnUrl,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the AuthContext
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};