import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import SqliteClient from '@/utils/SqliteClient';
import { VaultResponse } from '@/utils/types/webapi/VaultResponse';
import { NativeModules } from 'react-native';
import { VaultMetadata } from '@/utils/types/messaging/VaultMetadata';

type DbContextType = {
  sqliteClient: SqliteClient | null;
  dbInitialized: boolean;
  dbAvailable: boolean;
  initializeDatabase: (vaultResponse: VaultResponse, derivedKey: string | null) => Promise<void>;
  clearDatabase: () => void;
  vaultMetadata: VaultMetadata | null;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

/**
 * DbProvider to provide the SQLite client to the app that components can use to make database queries.
 */
export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const credentialManager = NativeModules.CredentialManager;

  /**
   * SQLite client is initialized in constructor as it passes SQL queries to the native module.
   */
  const sqliteClient = new SqliteClient();

  /**
   * Database initialization state. If true, the database has been initialized and the dbAvailable state is correct.
   */
  const [dbInitialized, setDbInitialized] = useState(false);

  /**
   * Database availability state. If true, the database is available. If false, the database is not available and needs to be unlocked or retrieved again from the API.
   */
  const [dbAvailable, setDbAvailable] = useState(false);

  /**
   * Vault metadata containing public/private email domains and revision number
   */
  const [vaultMetadata, setVaultMetadata] = useState<VaultMetadata | null>(null);

  const initializeDatabase = useCallback(async (vaultResponse: VaultResponse, derivedKey: string | null = null) => {
    // If the derived key is provided, store it in the keychain.
    // Otherwise we assume the encryption key is already stored in the keychain.
    if (derivedKey) {
      await sqliteClient.storeEncryptionKey(derivedKey);
    }

    const metadata: VaultMetadata = {
      publicEmailDomains: vaultResponse.vault.publicEmailDomainList,
      privateEmailDomains: vaultResponse.vault.privateEmailDomainList,
      vaultRevisionNumber: vaultResponse.vault.currentRevisionNumber,
    };

    // Initialize the SQLite client with both database and metadata
    await sqliteClient.storeEncryptedDatabase(
      vaultResponse.vault.blob,
      metadata
    );

    setDbInitialized(true);
    setDbAvailable(true);
    setVaultMetadata(metadata);
  }, []);

  const checkStoredVault = useCallback(async () => {
    try {
      const isVaultInitialized = await credentialManager.isVaultInitialized();
      if (isVaultInitialized) {
        // Get metadata from SQLite client
        const metadata = await sqliteClient.getVaultMetadata();
        if (metadata) {
          setDbInitialized(true);
          setDbAvailable(true);
          setVaultMetadata(metadata);
        } else {
          setDbInitialized(true);
          setDbAvailable(false);
          setVaultMetadata(null);
        }
      } else {
        setDbInitialized(true);
        setDbAvailable(false);
        setVaultMetadata(null);
      }
    } catch (error) {
      console.error('Error checking vault initialization:', error);
      setDbInitialized(true);
      setDbAvailable(false);
      setVaultMetadata(null);
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
    setDbInitialized(false);
    setVaultMetadata(null);
    // TODO: implement actual vault clearing.
    credentialManager.clearVault();
  }, []);

  const contextValue = useMemo(() => ({
    sqliteClient,
    dbInitialized,
    dbAvailable,
    initializeDatabase,
    clearDatabase,
    vaultMetadata
  }), [sqliteClient, dbInitialized, dbAvailable, initializeDatabase, clearDatabase, vaultMetadata]);

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
