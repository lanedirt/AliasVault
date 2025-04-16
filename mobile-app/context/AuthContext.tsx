import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDb } from './DbContext';

type AuthContextType = {
  isLoggedIn: boolean;
  isInitialized: boolean;
  username: string | null;
  setAuthTokens: (username: string, accessToken: string, refreshToken: string) => Promise<void>;
  initializeAuth: () => Promise<boolean>;
  login: () => Promise<void>;
  logout: (errorMessage?: string) => Promise<void>;
  globalMessage: string | null;
  clearGlobalMessage: () => void;
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
  const dbContext = useDb();

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
   * @returns boolean indicating whether the user is logged in
   */
  const initializeAuth = useCallback(async () : Promise<boolean> => {
    const accessToken = await AsyncStorage.getItem('accessToken') as string;
    const refreshToken = await AsyncStorage.getItem('refreshToken') as string;
    const username = await AsyncStorage.getItem('username') as string;
    let isAuthenticated = false;
    if (accessToken && refreshToken && username) {
      setUsername(username);
      setIsLoggedIn(true);
      isAuthenticated = true;
    }
    setIsInitialized(true);
    return isAuthenticated;
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
  const clearGlobalMessage = useCallback(() : void => {
    setGlobalMessage(null);
  }, []);

  const contextValue = useMemo(() => ({
    isLoggedIn,
    isInitialized,
    username,
    initializeAuth,
    setAuthTokens,
    login,
    logout,
    globalMessage,
    clearGlobalMessage,
  }), [isLoggedIn, isInitialized, username, globalMessage, setAuthTokens, login, logout, clearGlobalMessage, initializeAuth]);

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