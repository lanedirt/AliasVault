import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  isLoggedIn: boolean;
  isInitialized: boolean;
  username: string | null;
  login: (username: string, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
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

  /**
   * Check for tokens in chrome storage on initial load
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
   * Login
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
   * Logout
   */
  const logout = async () : Promise<void> => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_VAULT' });
    await chrome.storage.local.remove(['username', 'accessToken', 'refreshToken']);
    setUsername(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isInitialized, username, login, logout }}>
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