import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

type AuthContextType = {
  isLoggedIn: boolean;
  username: string | null;
  login: (username: string, accessToken: string, refreshToken: string) => Promise<void>;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [, setAccessToken] = useState<string | null>(null);
  const [, setRefreshToken] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  useEffect(() : void => {
    // Check for tokens in localStorage on initial load
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUsername = localStorage.getItem('username');
    if (storedAccessToken && storedRefreshToken && storedUsername) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      setUsername(storedUsername);
      setIsLoggedIn(true);
    }
  }, []);

  /**
   * Login
   */
  const login = async (username: string, accessToken: string, refreshToken: string) : Promise<void> => {
    accessTokenRef.current = accessToken; // Immediate update
    refreshTokenRef.current = refreshToken; // Immediate update
    await Promise.all([
      localStorage.setItem('username', username),
      localStorage.setItem('accessToken', accessToken),
      localStorage.setItem('refreshToken', refreshToken),
    ]);

    setUsername(username);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setIsLoggedIn(true);
  };

  /**
   * Update tokens
   */
  const updateTokens = async (accessToken: string, refreshToken: string) : Promise<void> => {
    accessTokenRef.current = accessToken; // Immediate update
    refreshTokenRef.current = refreshToken; // Immediate update
    await Promise.all([
      localStorage.setItem('accessToken', accessToken),
      localStorage.setItem('refreshToken', refreshToken),
    ]);

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  };

  /**
   * Logout
   */
  const logout = async () : Promise<void> => {
    await Promise.all([
      localStorage.removeItem('username'),
      localStorage.removeItem('accessToken'),
      localStorage.removeItem('refreshToken'),
    ]);

    await Promise.all([
      setUsername(null),
      setAccessToken(null),
      setRefreshToken(null),
      setIsLoggedIn(false),
    ]);
  };

  /**
   * Get access token
   */
  const getAccessToken = () : string | null => accessTokenRef.current || localStorage.getItem('accessToken');

  /**
   * Get refresh token
   */
  const getRefreshToken = () : string | null => refreshTokenRef.current || localStorage.getItem('refreshToken');

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, updateTokens, logout, getAccessToken, getRefreshToken }}>
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