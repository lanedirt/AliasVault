import React, { createContext, useContext } from 'react';
import { WebApiService } from '../services/WebApiService';
import { useAuth } from './AuthContext';

const WebApiContext = createContext<WebApiService | null>(null);

export const WebApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessToken, getRefreshToken, login, logout } = useAuth();

  const webApiService = new WebApiService(
    () => getAccessToken(),
    () => getRefreshToken(),
    (newAccessToken, newRefreshToken) => {
      login(username!, newAccessToken, newRefreshToken);
    },
    logout
  );

  return (
    <WebApiContext.Provider value={webApiService}>
      {children}
    </WebApiContext.Provider>
  );
};

export const useWebApi = () => {
  const context = useContext(WebApiContext);
  if (!context) {
    throw new Error('useWebApi must be used within a WebApiProvider');
  }
  return context;
};