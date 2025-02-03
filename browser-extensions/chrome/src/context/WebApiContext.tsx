import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebApiService } from '../utils/WebApiService';
import { useAuth } from './AuthContext';

const WebApiContext = createContext<WebApiService | null>(null);

/**
 * WebApiProvider to provide the WebApiService to the app that components can use.
 */
export const WebApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const [webApiService, setWebApiService] = useState<WebApiService | null>(null);

  /**
   * Initialize WebApiService
   */
  useEffect(() : void => {
    const service = new WebApiService(
      logout
    );
    setWebApiService(service);

    /**
     * Handles changes to the API URL in storage.
     * Initializes the base URL when the API URL changes.
     */
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) : void => {
      if (changes.apiUrl) {
        service.initializeBaseUrl();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () : void => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [logout]);

  if (!webApiService) {
    return null;
  }

  return (
    <WebApiContext.Provider value={webApiService}>
      {children}
    </WebApiContext.Provider>
  );
};

/**
 * Hook to use the WebApiService
 */
export const useWebApi = () : WebApiService => {
  const context = useContext(WebApiContext);
  if (!context) {
    throw new Error('useWebApi must be used within a WebApiProvider');
  }
  return context;
};
