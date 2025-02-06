import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SqliteClient from '../utils/SqliteClient';

type DbContextType = {
  sqliteClient: SqliteClient | null;
  dbInitialized: boolean;
  dbAvailable: boolean;
  initializeDatabase: (derivedKey: string, vault: string, publicEmailDomains: string[], privateEmailDomains: string[], vaultRevisionNumber: number) => Promise<void>;
  clearDatabase: () => void;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

/**
 * DbProvider to provide the SQLite client to the app that components can use to make database queries.
 */
export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /**
   * SQLite client.
   */
  const [sqliteClient, setSqliteClient] = useState<SqliteClient | null>(null);

  /**
   * Database initialization state. If true, the database has been initialized and the dbAvailable state is correct.
   */
  const [dbInitialized, setDbInitialized] = useState(false);

  /**
   * Database availability state. If true, the database is available. If false, the database is not available and needs to be unlocked or retrieved again from the API.
   */
  const [dbAvailable, setDbAvailable] = useState(false);

  /**
   * Public email domains.
   */
  const [, setPublicEmailDomains] = useState<string[]>([]);

  /**
   * Private email domains.
   */
  const [, setPrivateEmailDomains] = useState<string[]>([]);

  const initializeDatabase = useCallback(async (derivedKey: string, vault: string, publicEmailDomains: string[], privateEmailDomains: string[], vaultRevisionNumber: number) => {
    const client = new SqliteClient();
    await client.initializeFromBase64(vault);
    setSqliteClient(client);
    setDbInitialized(true);
    setDbAvailable(true);
    setPublicEmailDomains(publicEmailDomains);
    setPrivateEmailDomains(privateEmailDomains);

    /*
     * Store in background worker.
     * TODO: perhaps we can simply pass the full vaultresponse object instead of the individual fields
     * in case we need to access more fields in the future.
     */
    chrome.runtime.sendMessage({
      type: 'STORE_VAULT',
      derivedKey: derivedKey,
      vault: vault,
      publicEmailDomains: publicEmailDomains,
      privateEmailDomains: privateEmailDomains,
      vaultRevisionNumber: vaultRevisionNumber
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
        setPublicEmailDomains(response.publicEmailDomains);
        setPrivateEmailDomains(response.privateEmailDomains);
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

  /**
   * Check if database is initialized and try to retrieve vault from background
   */
  useEffect(() : void => {
    if (!dbInitialized) {
      checkStoredVault();
    }
  }, [dbInitialized, checkStoredVault]);

  /**
   * Add a listener for when the popup becomes visible
   */
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
   * Clear database and remove from background worker, called when logging out.
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
