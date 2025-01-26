import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  username: string | null;
  login: (username: string, accessToken: string, refreshToken: string) => Promise<void>;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [, setAccessToken] = useState<string | null>(null);
  const [, setRefreshToken] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  useEffect(() => {
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

  const login = async (username: string, accessToken: string, refreshToken: string) => {
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

  const updateTokens = async (accessToken: string, refreshToken: string) => {
    accessTokenRef.current = accessToken; // Immediate update
    refreshTokenRef.current = refreshToken; // Immediate update
    await Promise.all([
      localStorage.setItem('accessToken', accessToken),
      localStorage.setItem('refreshToken', refreshToken),
    ]);

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  };

  const logout = async () => {
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

  // Make sure to use the ref for accessToken and refreshToken to ensure
  // that the latest values are used.
  const getAccessToken = () => accessTokenRef.current || localStorage.getItem('accessToken');
  const getRefreshToken = () => refreshTokenRef.current || localStorage.getItem('refreshToken');

  return (
    <AuthContext.Provider value={{ isLoggedIn, username, login, updateTokens, logout, getAccessToken, getRefreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};