import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import SqliteClient from '../../shared/SqliteClient';
import { VaultResponse } from '../../shared/types/webapi/VaultResponse';
import EncryptionUtility from '../../shared/EncryptionUtility';
type DbContextType = {
  sqliteClient: SqliteClient | null;
  dbInitialized: boolean;
  dbAvailable: boolean;
  initializeDatabase: (vaultResponse: VaultResponse, derivedKey: string) => Promise<void>;
  clearDatabase: () => void;
  vaultRevision: number;
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
   * Vault revision.
   */
  const [vaultRevision, setVaultRevision] = useState(0);

  /**
   * Private email domains.
   */
  const [, setPrivateEmailDomains] = useState<string[]>([]);

  const initializeDatabase = useCallback(async (vaultResponse: VaultResponse, derivedKey: string) => {
    // Attempt to decrypt the blob.
    const decryptedBlob = await EncryptionUtility.symmetricDecrypt(
      vaultResponse.vault.blob,
      derivedKey
    );

    // Initialize the SQLite client.
    const client = new SqliteClient();
    await client.initializeFromBase64(decryptedBlob);

    setSqliteClient(client);
    setDbInitialized(true);
    setDbAvailable(true);
    setPublicEmailDomains(vaultResponse.vault.publicEmailDomainList);
    setPrivateEmailDomains(vaultResponse.vault.privateEmailDomainList);
    setVaultRevision(vaultResponse.vault.currentRevisionNumber);

    /*
     * Store encrypted vault in background worker.
     */
    chrome.runtime.sendMessage({
      type: 'STORE_VAULT',
      derivedKey: derivedKey,
      vaultResponse: vaultResponse,
    });
  }, []);

  const checkStoredVault = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_VAULT' });
      if (response?.vault) {
        const client = new SqliteClient();
        await client.initializeFromBase64(response.vault);

        setSqliteClient(client);
        setDbInitialized(true);
        setDbAvailable(true);
        setPublicEmailDomains(response.publicEmailDomains);
        setPrivateEmailDomains(response.privateEmailDomains);
        setVaultRevision(response.vaultRevisionNumber);
      } else {
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
   * Clear database and remove from background worker, called when logging out.
   */
  const clearDatabase = useCallback(() : void => {
    setSqliteClient(null);
    setDbInitialized(false);
    chrome.runtime.sendMessage({ type: 'CLEAR_VAULT' });
  }, []);

  const contextValue = useMemo(() => ({
    sqliteClient,
    dbInitialized,
    dbAvailable,
    initializeDatabase,
    clearDatabase,
    vaultRevision
  }), [sqliteClient, dbInitialized, dbAvailable, initializeDatabase, clearDatabase, vaultRevision]);

  return (
    <DbContext.Provider value={contextValue}>
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
