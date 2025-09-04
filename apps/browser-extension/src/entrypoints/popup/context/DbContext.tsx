import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { sendMessage } from 'webext-bridge/popup';

import type { EncryptionKeyDerivationParams, VaultMetadata } from '@/utils/dist/shared/models/metadata';
import type { VaultResponse } from '@/utils/dist/shared/models/webapi';
import EncryptionUtility from '@/utils/EncryptionUtility';
import SqliteClient from '@/utils/SqliteClient';
import { StoreVaultRequest } from '@/utils/types/messaging/StoreVaultRequest';
import type { VaultResponse as messageVaultResponse } from '@/utils/types/messaging/VaultResponse';

type DbContextType = {
  sqliteClient: SqliteClient | null;
  dbInitialized: boolean;
  dbAvailable: boolean;
  initializeDatabase: (vaultResponse: VaultResponse, derivedKey: string) => Promise<SqliteClient>;
  storeEncryptionKey: (derivedKey: string) => Promise<void>;
  getEncryptionKey: () => Promise<string | null>;
  storeEncryptionKeyDerivationParams: (params: EncryptionKeyDerivationParams) => Promise<void>;
  getEncryptionKeyDerivationParams: () => Promise<EncryptionKeyDerivationParams | null>;
  clearDatabase: () => void;
  getVaultMetadata: () => Promise<VaultMetadata | null>;
  setCurrentVaultRevisionNumber: (revisionNumber: number) => Promise<void>;
  hasPendingMigrations: () => Promise<boolean>;
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
   * Vault revision.
   */
  const [vaultMetadata, setVaultMetadata] = useState<VaultMetadata | null>(null);

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
    setVaultMetadata({
      publicEmailDomains: vaultResponse.vault.publicEmailDomainList,
      privateEmailDomains: vaultResponse.vault.privateEmailDomainList,
      vaultRevisionNumber: vaultResponse.vault.currentRevisionNumber,
    });

    /**
     * Store encrypted vault in background worker.
     */
    const request: StoreVaultRequest = {
      vaultBlob: vaultResponse.vault.blob,
      publicEmailDomainList: vaultResponse.vault.publicEmailDomainList,
      privateEmailDomainList: vaultResponse.vault.privateEmailDomainList,
      vaultRevisionNumber: vaultResponse.vault.currentRevisionNumber,
    };

    await sendMessage('STORE_VAULT', request, 'background');

    return client;
  }, []);

  const checkStoredVault = useCallback(async () => {
    try {
      const response = await sendMessage('GET_VAULT', {}, 'background') as messageVaultResponse;
      if (response?.vault) {
        const client = new SqliteClient();
        await client.initializeFromBase64(response.vault);

        setSqliteClient(client);
        setDbInitialized(true);
        setDbAvailable(true);

        setVaultMetadata({
          publicEmailDomains: response.publicEmailDomains ?? [],
          privateEmailDomains: response.privateEmailDomains ?? [],
          vaultRevisionNumber: response.vaultRevisionNumber ?? 0,
        });
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
   * Get the vault metadata.
   */
  const getVaultMetadata = useCallback(async () : Promise<VaultMetadata | null> => {
    return vaultMetadata;
  }, [vaultMetadata]);

  /**
   * Set the current vault revision number.
   */
  const setCurrentVaultRevisionNumber = useCallback(async (revisionNumber: number) => {
    setVaultMetadata({
      publicEmailDomains: vaultMetadata?.publicEmailDomains ?? [],
      privateEmailDomains: vaultMetadata?.privateEmailDomains ?? [],
      vaultRevisionNumber: revisionNumber,
    });
  }, [vaultMetadata]);

  /**
   * Check if there are pending migrations.
   */
  const hasPendingMigrations = useCallback(async () => {
    if (!sqliteClient) {
      return false;
    }
    return await sqliteClient.hasPendingMigrations();
  }, [sqliteClient]);

  /**
   * Check if database is initialized and try to retrieve vault from background
   */
  useEffect(() : void => {
    if (!dbInitialized) {
      checkStoredVault();
    }
  }, [dbInitialized, checkStoredVault]);

  /**
   * Store encryption key in background worker.
   */
  const storeEncryptionKey = useCallback(async (encryptionKey: string) : Promise<void> => {
    await sendMessage('STORE_ENCRYPTION_KEY', encryptionKey, 'background');
  }, []);

  /**
   * Get encryption key from background worker.
   */
  const getEncryptionKey = useCallback(async () : Promise<string | null> => {
    return await sendMessage('GET_ENCRYPTION_KEY', {}, 'background') as string | null;
  }, []);

  /**
   * Store encryption key derivation params in background worker.
   */
  const storeEncryptionKeyDerivationParams = useCallback(async (params: EncryptionKeyDerivationParams) : Promise<void> => {
    await sendMessage('STORE_ENCRYPTION_KEY_DERIVATION_PARAMS', params, 'background');
  }, []);

  /**
   * Get encryption key derivation params from background worker.
   */
  const getEncryptionKeyDerivationParams = useCallback(async () : Promise<EncryptionKeyDerivationParams | null> => {
    return await sendMessage('GET_ENCRYPTION_KEY_DERIVATION_PARAMS', {}, 'background') as EncryptionKeyDerivationParams | null;
  }, []);

  /**
   * Clear database and remove from background worker, called when logging out.
   */
  const clearDatabase = useCallback(() : void => {
    setSqliteClient(null);
    setDbInitialized(false);
    setDbAvailable(false);
    sendMessage('CLEAR_VAULT', {}, 'background');
  }, []);

  const contextValue = useMemo(() => ({
    sqliteClient,
    dbInitialized,
    dbAvailable,
    initializeDatabase,
    storeEncryptionKey,
    getEncryptionKey,
    storeEncryptionKeyDerivationParams,
    getEncryptionKeyDerivationParams,
    clearDatabase,
    getVaultMetadata,
    setCurrentVaultRevisionNumber,
    hasPendingMigrations,
  }), [sqliteClient, dbInitialized, dbAvailable, initializeDatabase, storeEncryptionKey, getEncryptionKey, storeEncryptionKeyDerivationParams, getEncryptionKeyDerivationParams, clearDatabase, getVaultMetadata, setCurrentVaultRevisionNumber, hasPendingMigrations]);

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
