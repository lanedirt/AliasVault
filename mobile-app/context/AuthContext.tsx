import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDb } from './DbContext';
import { NativeModules, AppState } from 'react-native';
import { router, usePathname } from 'expo-router';
import { NavigationContainerRef, ParamListBase } from '@react-navigation/native';

// Create a navigation reference
export const navigationRef = React.createRef<NavigationContainerRef<ParamListBase>>();

export type AuthMethod = 'faceid' | 'password';

type AuthContextType = {
  isLoggedIn: boolean;
  isInitialized: boolean;
  username: string | null;
  enabledAuthMethods: AuthMethod[];
  isFaceIDEnabled: () => boolean;
  setAuthTokens: (username: string, accessToken: string, refreshToken: string) => Promise<void>;
  initializeAuth: () => Promise<{ isLoggedIn: boolean; enabledAuthMethods: AuthMethod[] }>;
  login: () => Promise<void>;
  logout: (errorMessage?: string) => Promise<void>;
  globalMessage: string | null;
  clearGlobalMessage: () => void;
  setAuthMethods: (methods: AuthMethod[]) => Promise<void>;
  getAuthMethodDisplay: () => string;
  getAutoLockTimeout: () => Promise<number>;
  setAutoLockTimeout: (timeout: number) => Promise<void>;
  returnPath: string | null;
  setReturnPath: (path: string | null) => Promise<void>;
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
  const [enabledAuthMethods, setEnabledAuthMethods] = useState<AuthMethod[]>(['password']);
  const [returnPath, setReturnPathState] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const dbContext = useDb();
  const pathname = usePathname();

  /**
   * Check if Face ID is enabled based on enabled auth methods
   */
  const isFaceIDEnabled = useCallback(() : boolean => {
    return enabledAuthMethods.includes('faceid');
  }, [enabledAuthMethods]);

  /**
   * Set auth tokens in storage as part of the login process. After db is initialized, the login method should be called as well.
   */
  const setAuthTokens = useCallback(async (username: string, accessToken: string, refreshToken: string) : Promise<void> => {
    await AsyncStorage.setItem('username', username);
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);

    setUsername(username);
  }, []);

  /**
   * Initialize the authentication state, called on initial load by _layout.tsx.
   * @returns object containing whether the user is logged in and enabled auth methods
   */
  const initializeAuth = useCallback(async () : Promise<{ isLoggedIn: boolean; enabledAuthMethods: AuthMethod[] }> => {
    const accessToken = await AsyncStorage.getItem('accessToken') as string;
    const refreshToken = await AsyncStorage.getItem('refreshToken') as string;
    const username = await AsyncStorage.getItem('username') as string;
    const savedAuthMethods = await AsyncStorage.getItem('authMethods');
    let isAuthenticated = false;
    let methods: AuthMethod[] = ['password'];

    if (accessToken && refreshToken && username) {
      setUsername(username);
      setIsLoggedIn(true);
      isAuthenticated = true;
      if (savedAuthMethods) {
        try {
          const parsedMethods = JSON.parse(savedAuthMethods) as AuthMethod[];
          if (Array.isArray(parsedMethods) && parsedMethods.every(method => method === 'faceid' || method === 'password')) {
            methods = parsedMethods;
            setEnabledAuthMethods(parsedMethods);
          }
        } catch (e) {
          // If parsing fails, use default
          setEnabledAuthMethods(['password']);
        }
      }
    }
    setIsInitialized(true);
    return { isLoggedIn: isAuthenticated, enabledAuthMethods: methods };
  }, []);

  /**
   * Set logged in status to true which refreshes the app.
   */
  const login = useCallback(async () : Promise<void> => {
    setIsLoggedIn(true);
  }, []);

  /**
   * Logout the user and clear the auth tokens from chrome storage.
   */
  const logout = useCallback(async (errorMessage?: string) : Promise<void> => {
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
    setEnabledAuthMethods(['password']);
  }, [dbContext]);

  /**
   * Clear global message (called after displaying the message).
   */
  const clearGlobalMessage = useCallback(() : void => {
    setGlobalMessage(null);
  }, []);

  /**
   * Set the authentication methods and save them to storage
   */
  const setAuthMethods = useCallback(async (methods: AuthMethod[]) : Promise<void> => {
    // Ensure password is always included
    const methodsToSave = methods.includes('password') ? methods : [...methods, 'password'];

    // Save to AsyncStorage
    await AsyncStorage.setItem('authMethods', JSON.stringify(methodsToSave));

    // Update iOS credentials manager
    try {
      await NativeModules.CredentialManager.setAuthMethods(methodsToSave);
    } catch (error) {
      console.error('Failed to update iOS auth methods:', error);
      // Continue with the update even if iOS update fails
    }

    // Use a state update function to ensure we're working with the latest state
    setEnabledAuthMethods(prevMethods => {
      // Only update if the methods have actually changed
      if (JSON.stringify(prevMethods) !== JSON.stringify(methodsToSave)) {
        return methodsToSave as AuthMethod[];
      }
      return prevMethods;
    });
  }, []);

  /**
   * Get the display label for the current auth method
   * Prefers Face ID if enabled, otherwise falls back to Password
   */
  const getAuthMethodDisplay = useCallback(() : string => {
    return enabledAuthMethods.includes('faceid') ? 'Face ID' : 'Password';
  }, [enabledAuthMethods]);

  /**
   * Get the auto-lock timeout from the iOS credentials manager
   */
  const getAutoLockTimeout = async () : Promise<number> => {
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
      // Update iOS credentials manager
      try {
        await NativeModules.CredentialManager.setAutoLockTimeout(timeout);
      } catch (error) {
        console.error('Failed to update iOS auto-lock timeout:', error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const isVaultUnlocked = async () : Promise<boolean> => {
    try {
      const isUnlocked = await NativeModules.CredentialManager.isVaultUnlocked();
      return isUnlocked;
    } catch (error) {
      console.error('Failed to check vault status:', error);
      return false;
    }
  };

  const setReturnPath = useCallback(async (path: string | null) => {
    if (path) {
      await AsyncStorage.setItem('returnPath', path);
    } else {
      await AsyncStorage.removeItem('returnPath');
    }
    setReturnPathState(path);
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground
        console.log('App coming to foreground in AuthContext');
        if (pathname && !pathname.includes('unlock') && !pathname.includes('login')) {
          try {
            // Check if vault is unlocked.
            const isUnlocked = await isVaultUnlocked();
            if (!isUnlocked) {
              // Database connection failed, store current path and navigate to unlock flow
              console.log('Vault is not unlocked anymore, navigating to unlock flow');
              await setReturnPath(pathname);
              // Reset navigation to root using Expo Router
              router.replace('/sync');
            } else {
              console.log('Vault is still unlocked, staying on current screen');
            }
          } catch (error) {
            // Database query failed, store current path and navigate to unlock flow
            console.log('Failed to check vault status, navigating to unlock flow:', error);
            await setReturnPath(pathname);
            router.replace('/sync');
          }
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App going to background
        console.log('App going to background in AuthContext');
        if (pathname && !pathname.includes('unlock') && !pathname.includes('login')) {
          await setReturnPath(pathname);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [pathname, isVaultUnlocked, setReturnPath]);

  const contextValue = useMemo(() => ({
    isLoggedIn,
    isInitialized,
    username,
    enabledAuthMethods,
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
    returnPath,
    setReturnPath,
  }), [isLoggedIn, isInitialized, username, globalMessage, enabledAuthMethods, setAuthTokens, login, logout, clearGlobalMessage, initializeAuth, setAuthMethods, getAuthMethodDisplay, isFaceIDEnabled, getAutoLockTimeout, setAutoLockTimeout, returnPath, setReturnPath]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the AuthContext
 */
export const useAuth = () : AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};