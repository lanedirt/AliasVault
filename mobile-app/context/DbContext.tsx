import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import SqliteClient from '@/utils/SqliteClient';
import { VaultResponse } from '@/utils/types/webapi/VaultResponse';
import { VaultMetadata } from '@/utils/types/messaging/VaultMetadata';
import NativeVaultManager from '../specs/NativeVaultManager';

type DbContextType = {
  sqliteClient: SqliteClient | null;
  dbInitialized: boolean;
  dbAvailable: boolean;
  initializeDatabase: (vaultResponse: VaultResponse, derivedKey: string | null) => Promise<void>;
  clearDatabase: () => void;
  getVaultMetadata: () => Promise<VaultMetadata | null>;
  testDatabaseConnection: (derivedKey: string) => Promise<boolean>;
  unlockVault: () => Promise<boolean>;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

/**
 * DbProvider to provide the SQLite client to the app that components can use to make database queries.
 */
export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

    // Initialize the database in the native module
    await unlockVault();

    setDbInitialized(true);
    setDbAvailable(true);
  }, []);

  const checkStoredVault = useCallback(async () => {
    try {
      const isVaultInitialized = await NativeVaultManager.isVaultInitialized();
      if (isVaultInitialized) {
        // Get metadata from SQLite client
        const metadata = await sqliteClient.getVaultMetadata();
        if (metadata) {
          console.log('Vault metadata found, setting dbInitialized and dbAvailable to true');
          setDbInitialized(true);
          setDbAvailable(true);
        } else {
          console.log('Vault metadata not found, setting dbInitialized and dbAvailable to false');
          setDbInitialized(true);
          setDbAvailable(false);
        }
      } else {
        console.log('Vault not initialized, setting dbInitialized and dbAvailable to false');
        setDbInitialized(true);
        setDbAvailable(false);
      }
    } catch (error) {
      console.error('Error checking vault initialization:', error);
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
    setDbInitialized(false);
    // TODO: implement actual vault clearing.
    NativeVaultManager.clearVault();
  }, []);

  /**
   * Unlock the vault in the native module which will decrypt the database using the stored encryption key
   * and load it into memory.
   */
  const unlockVault = useCallback(async () : Promise<boolean> => {
    try {
      await NativeVaultManager.unlockVault();
      return true;
    } catch (error) {
      console.error('Failed to unlock vault:', error);
      return false;
    }
  }, []);

  /**
   * Get the current vault metadata directly from SQLite client
   */
  const getVaultMetadata = useCallback(async () : Promise<VaultMetadata | null> => {
    return await sqliteClient.getVaultMetadata();
  }, []);

  /**
   * Test if the database is working with the provided (to be stored) encryption key by performing a simple query
   * @param derivedKey The encryption key to test with
   * @returns true if the database is working, false otherwise
   */
  const testDatabaseConnection = useCallback(async (derivedKey: string): Promise<boolean> => {
    try {
      // Store the encryption key
      await sqliteClient.storeEncryptionKey(derivedKey);

      // Initialize the database
      await unlockVault();

      // Try to get the database version as a simple test query
      const version = await sqliteClient.getDatabaseVersion();

      if (version && version.length > 0) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }, []);

  const contextValue = useMemo(() => ({
    sqliteClient,
    dbInitialized,
    dbAvailable,
    initializeDatabase,
    clearDatabase,
    getVaultMetadata,
    testDatabaseConnection,
    unlockVault
  }), [sqliteClient, dbInitialized, dbAvailable, initializeDatabase, clearDatabase, getVaultMetadata, testDatabaseConnection, unlockVault]);

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
