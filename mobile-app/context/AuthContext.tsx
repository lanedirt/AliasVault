import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDb } from './DbContext';
import { NativeModules, AppState } from 'react-native';
import { router, usePathname } from 'expo-router';
import { NavigationContainerRef, ParamListBase } from '@react-navigation/native';
import * as LocalAuthentication from 'expo-local-authentication';

// Create a navigation reference
export const navigationRef = React.createRef<NavigationContainerRef<ParamListBase>>();

export type AuthMethod = 'faceid' | 'password';

type AuthContextType = {
  isLoggedIn: boolean;
  isInitialized: boolean;
  username: string | null;
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
}

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
  const appState = useRef(AppState.currentState);
  const dbContext = useDb();
  const pathname = usePathname();

  /**
   * Get enabled auth methods from the native module
   */
  const getEnabledAuthMethods = useCallback(async (): Promise<AuthMethod[]> => {
    try {
      let methods = await NativeModules.CredentialManager.getAuthMethods() as AuthMethod[];
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
      await NativeModules.CredentialManager.setAuthMethods(methodsToSave);
    } catch (error) {
      console.error('Failed to update iOS auth methods:', error);
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
          return 'Face ID';
        }
      } catch (error) {
        console.error('Failed to check Face ID enrollment:', error);
      }
    }
    return 'Password';
  }, [getEnabledAuthMethods]);

  /**
   * Get the auto-lock timeout from the iOS credentials manager
   */
  const getAutoLockTimeout = async (): Promise<number> => {
    try {
      const timeout = await NativeModules.CredentialManager.getAutoLockTimeout();
      return timeout;
    } catch (error) {
      console.error('Failed to get auto-lock timeout:', error);
      return 0;
    }
  }

  /**
   * Set the auto-lock timeout in the iOS credentials manager
   */
  const setAutoLockTimeout = async (timeout: number) => {
    try {
      await NativeModules.CredentialManager.setAutoLockTimeout(timeout);
    } catch (error) {
      console.error('Failed to update iOS auto-lock timeout:', error);
    }
  };

  const isVaultUnlocked = async (): Promise<boolean> => {
    try {
      const isUnlocked = await NativeModules.CredentialManager.isVaultUnlocked();
      return isUnlocked;
    } catch (error) {
      console.error('Failed to check vault status:', error);
      return false;
    }
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground
        console.log('App coming to foreground in AuthContext');
        if (!pathname?.includes('unlock') && !pathname?.includes('login')) {
          try {
            // Check if vault is unlocked.
            const isUnlocked = await isVaultUnlocked();
            if (!isUnlocked) {
              // Database connection failed, navigate to unlock flow
              console.log('Vault is not unlocked anymore, navigating to unlock flow');
              router.replace('/sync');
            } else {
              console.log('Vault is still unlocked, staying on current screen');
            }
          } catch (error) {
            // Database query failed, navigate to unlock flow
            console.log('Failed to check vault status, navigating to unlock flow:', error);
            router.replace('/sync');
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isVaultUnlocked]);

  const contextValue = useMemo(() => ({
    isLoggedIn,
    isInitialized,
    username,
    getEnabledAuthMethods,
    isFaceIDEnabled,
    initializeAuth,
    setAuthTokens,
    login,
    logout,
    globalMessage,
    clearGlobalMessage,
    setAuthMethods,
    getAuthMethodDisplay,
    getAutoLockTimeout,
    setAutoLockTimeout,
  }), [isLoggedIn, isInitialized, username, globalMessage, getEnabledAuthMethods, setAuthTokens, login, logout, clearGlobalMessage, initializeAuth, setAuthMethods, getAuthMethodDisplay, isFaceIDEnabled, getAutoLockTimeout, setAutoLockTimeout]);

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