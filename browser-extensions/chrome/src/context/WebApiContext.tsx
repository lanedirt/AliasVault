import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebApiService } from '../utils/WebApiService';
import { useAuth } from './AuthContext';

const WebApiContext = createContext<WebApiService | null>(null);

export const WebApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessToken, getRefreshToken, updateTokens, logout } = useAuth();
  const [webApiService, setWebApiService] = useState<WebApiService | null>(null);

  useEffect(() => {
    const service = new WebApiService(
      () => getAccessToken(),
      () => getRefreshToken(),
      (newAccessToken, newRefreshToken) => {
        updateTokens(newAccessToken, newRefreshToken);
      },
      logout
    );
    setWebApiService(service);

    // Listen for changes to the API URL in storage
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.apiUrl) {
        service.initializeBaseUrl();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [getAccessToken, getRefreshToken, updateTokens, logout]);

  if (!webApiService) {
    return null;
  }

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
