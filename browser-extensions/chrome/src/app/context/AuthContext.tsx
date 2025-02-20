import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useDb } from './DbContext';

type AuthContextType = {
  isLoggedIn: boolean;
  isInitialized: boolean;
  username: string | null;
  setAuthTokens: (username: string, accessToken: string, refreshToken: string) => Promise<void>;
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
   * Check for tokens in chrome storage on initial load.
   */
  useEffect(() => {
    /**
     * Initialize the authentication state.
     */
    const initializeAuth = async () : Promise<void> => {
      const stored = await chrome.storage.local.get(['accessToken', 'refreshToken', 'username']);
      if (stored.accessToken && stored.refreshToken && stored.username) {
        setUsername(stored.username);
        setIsLoggedIn(true);
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  /**
   * Set auth tokens in chrome storage as part of the login process. After db is initialized, the login method should be called as well.
   */
  const setAuthTokens = useCallback(async (username: string, accessToken: string, refreshToken: string) : Promise<void> => {
    await chrome.storage.local.set({
      username,
      accessToken,
      refreshToken
    });

    setUsername(username);
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
    await chrome.runtime.sendMessage({ type: 'CLEAR_VAULT' });
    await chrome.storage.local.remove(['username', 'accessToken', 'refreshToken']);
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
    setAuthTokens,
    login,
    logout,
    globalMessage,
    clearGlobalMessage,
  }), [isLoggedIn, isInitialized, username, globalMessage, setAuthTokens, login, logout, clearGlobalMessage]);

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