import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useDb } from './DbContext';
import { storage } from 'wxt/storage';
import { sendMessage } from 'webext-bridge/popup';
import { VAULT_LOCKED_DISMISS_UNTIL_KEY } from '@/entrypoints/contentScript/Popup';

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
      const accessToken = await storage.getItem('local:accessToken') as string;
      const refreshToken = await storage.getItem('local:refreshToken') as string;
      const username = await storage.getItem('local:username') as string;
      if (accessToken && refreshToken && username) {
        setUsername(username);
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
    await storage.setItem('local:username', username);
    await storage.setItem('local:accessToken', accessToken);
    await storage.setItem('local:refreshToken', refreshToken);

    setUsername(username);
  }, []);

  /**
   * Set logged in status to true which refreshes the app.
   */
  const login = useCallback(async () : Promise<void> => {
    setIsLoggedIn(true);

    // Clear dismiss until (which can be enabled after user has dimissed vault is locked popup) to ensure popup is shown.
    await storage.setItem(VAULT_LOCKED_DISMISS_UNTIL_KEY, 0);
  }, []);

  /**
   * Logout the user and clear the auth tokens from chrome storage.
   */
  const logout = useCallback(async (errorMessage?: string) : Promise<void> => {
    await sendMessage('CLEAR_VAULT', {}, 'background');
    await storage.removeItems(['local:username', 'local:accessToken', 'local:refreshToken']);
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