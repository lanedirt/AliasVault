import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SqliteClient from '../utils/SqliteClient';

type DbContextType = {
  sqliteClient: SqliteClient | null;
  dbInitialized: boolean;
  dbAvailable: boolean;
  initializeDatabase: (blob: string) => Promise<void>;
  clearDatabase: () => void;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

/**
 * DbProvider
 */
export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sqliteClient, setSqliteClient] = useState<SqliteClient | null>(null);

  /**
   * Database initialization state. If true, the database has been initialized and the dbAvailable state is correct.
   */
  const [dbInitialized, setDbInitialized] = useState(false);
  /**
   * Database availability state. If true, the database is available. If false, the database is not available and needs to be unlocked or retrieved again from the API.
   */
  const [dbAvailable, setDbAvailable] = useState(false);

  const initializeDatabase = useCallback(async (blob: string) => {
    const client = new SqliteClient();
    await client.initializeFromBase64(blob);
    setSqliteClient(client);
    setDbInitialized(true);
    setDbAvailable(true);

    // Store in background worker
    chrome.runtime.sendMessage({
      type: 'STORE_VAULT',
      vault: blob
    });
  }, []);

  const checkStoredVault = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_VAULT' });
      if (response && response.vault) {
        const client = new SqliteClient();
        await client.initializeFromBase64(response.vault);
        setSqliteClient(client);
        setDbInitialized(true);
        setDbAvailable(true);

        // Store in background worker
        chrome.runtime.sendMessage({
          type: 'STORE_VAULT',
          vault: response.vault
        });
      }
      else {
        setDbInitialized(true);
        setDbAvailable(false);
      }
    } catch (error) {
      console.error('Error retrieving vault from background:', error);
      setDbInitialized(true);
      setDbAvailable(false);
    }
  }, []);

  useEffect(() : void => {
    // Check if database is initialized and try to retrieve vault from background
    if (!dbInitialized) {
      checkStoredVault();
    }
  }, [dbInitialized, checkStoredVault]);

  // Add a listener for when the popup becomes visible
  useEffect(() : void => {
    /**
     * Handles visibility state changes of the document.
     * Checks and retrieves stored vault data when document becomes visible and database is not initialized.
     */
    const handleVisibilityChange = () : void => {
      if (document.visibilityState === 'visible' && !dbInitialized) {
        checkStoredVault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () : void => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dbInitialized, checkStoredVault]);

  /**
   * Clear database
   */
  const clearDatabase = () : void => {
    setSqliteClient(null);
    setDbInitialized(false);
    chrome.runtime.sendMessage({ type: 'CLEAR_VAULT' });
  };

  return (
    <DbContext.Provider value={{ sqliteClient, dbInitialized, dbAvailable, initializeDatabase, clearDatabase }}>
      {children}
    </DbContext.Provider>
  );
};

/**
 * Hook to use the DbContext
 */
export const useDb = () : DbContextType => {
  const context = useContext(DbContext);
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider');
  }
  return context;
};
