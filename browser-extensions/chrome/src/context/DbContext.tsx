import React, { createContext, useContext, useState, useEffect } from 'react';
import SqliteClient from '../utilities/SqliteClient';

interface DbContextType {
  sqliteClient: SqliteClient | null;
  isInitialized: boolean;
  initializeDatabase: (blob: string) => Promise<void>;
  clearDatabase: () => void;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sqliteClient, setSqliteClient] = useState<SqliteClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkStoredVault = async () => {
    console.log('Checking for stored vault');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_VAULT' });
      if (response && response.vault) {
        console.log('Found stored vault');
        await initializeDatabase(response.vault);
      }
    } catch (error) {
      console.log('No stored vault found');
      console.error('Error retrieving vault from background:', error);
    }
  };

  useEffect(() => {
    // Check if database is initialized and try to retrieve vault from background
    console.log('Checking if database is initialized');
    if (!isInitialized) {
      checkStoredVault();
    }
  }, [isInitialized]);

  // Add a listener for when the popup becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isInitialized) {
        checkStoredVault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized]);

  const initializeDatabase = async (blob: string) => {
    const client = new SqliteClient();
    await client.initializeFromBase64(blob);
    setSqliteClient(client);
    setIsInitialized(true);

    // Store in background worker
    chrome.runtime.sendMessage({
      type: 'STORE_VAULT',
      vault: blob
    });
  };

  const clearDatabase = () => {
    setSqliteClient(null);
    setIsInitialized(false);
    chrome.runtime.sendMessage({ type: 'CLEAR_VAULT' });
  };

  return (
    <DbContext.Provider value={{ sqliteClient, isInitialized, initializeDatabase, clearDatabase }}>
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
};