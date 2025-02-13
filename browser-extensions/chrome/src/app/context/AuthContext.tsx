import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDb } from './DbContext';

type AuthContextType = {
  isLoggedIn: boolean;
  isInitialized: boolean;
  username: string | null;
  login: (username: string, accessToken: string, refreshToken: string) => Promise<void>;
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
   * Login.
   */
  const login = async (username: string, accessToken: string, refreshToken: string) : Promise<void> => {
    await chrome.storage.local.set({
      username,
      accessToken,
      refreshToken
    });

    setUsername(username);
    setIsLoggedIn(true);
  };

  /**
   * Logout.
   */
  const logout = async (errorMessage?: string) : Promise<void> => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_VAULT' });
    await chrome.storage.local.remove(['username', 'accessToken', 'refreshToken']);
    await dbContext?.clearDatabase();

    // Set local storage global message that will be shown on the login page.
    if (errorMessage) {
      setGlobalMessage(errorMessage);
    }

    setUsername(null);
    setIsLoggedIn(false);
  };

  /**
   * Clear global message (called after displaying the message).
   */
  const clearGlobalMessage = () : void => {
    setGlobalMessage(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isInitialized, username, login, logout, globalMessage, clearGlobalMessage }}>
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