import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';

import { useVaultSync } from '@/hooks/useVaultSync';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import NativeVaultManager from '@/specs/NativeVaultManager';

type VaultPostResponse = {
  status: number;
  newRevisionNumber: number;
}

type VaultMutationOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to execute a vault mutation.
 */
export function useVaultMutate() : {
  executeVaultMutation: (operation: () => Promise<void>, options?: VaultMutationOptions) => Promise<void>;
  isLoading: boolean;
  syncStatus: string;
  } {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Syncing vault');
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();
  const { syncVault } = useVaultSync();

  /**
   * Execute the provided operation (e.g. create/update/delete credential)
   */
  const executeOperation = useCallback(async (
    operation: () => Promise<void>,
    options: VaultMutationOptions
  ) : Promise<void> => {
    setSyncStatus('Saving changes to vault');

    // Execute the provided operation (e.g. create/update/delete credential)
    await operation();

    // Get the current vault revision number
    const currentRevision = await NativeVaultManager.getCurrentVaultRevisionNumber();

    // Get the encrypted database
    const encryptedDb = await NativeVaultManager.getEncryptedDatabase();
    if (!encryptedDb) {
      throw new Error('Failed to get encrypted database');
    }

    setSyncStatus('Uploading vault to server');

    // Get all private email domains from credentials in order to claim them on server
    const privateEmailDomains = await dbContext.sqliteClient!.getPrivateEmailDomains();

    const credentials = await dbContext.sqliteClient!.getAllCredentials();
    const privateEmailAddresses = credentials
      .filter(cred => cred.Alias?.Email != null)
      .map(cred => cred.Alias!.Email!)
      .filter((email, index, self) => self.indexOf(email) === index)
      .filter(email => {
        return privateEmailDomains.some(domain => email.toLowerCase().endsWith(`@${domain.toLowerCase()}`));
      });

    // Get username from the auth context
    const username = authContext.username;
    if (!username) {
      throw new Error('Username not found');
    }

    // Create vault object for upload
    const newVault = {
      blob: encryptedDb,
      createdAt: new Date().toISOString(),
      credentialsCount: credentials.length,
      currentRevisionNumber: currentRevision,
      emailAddressList: privateEmailAddresses,
      privateEmailDomainList: [], // Empty on purpose, API will not use this for vault updates
      publicEmailDomainList: [], // Empty on purpose, API will not use this for vault updates
      encryptionPublicKey: '', // Empty on purpose, only required if new public/private key pair is generated
      client: '', // Empty on purpose, API will not use this for vault updates
      updatedAt: new Date().toISOString(),
      username: username,
      version: await dbContext.sqliteClient!.getDatabaseVersion() ?? '0.0.0'
    };

    try {
      // Upload to server
      const response = await webApi.post<typeof newVault, VaultPostResponse>('Vault', newVault);

      // If we get here, it means we have a valid connection to the server.
      authContext.setOfflineMode(false);

      if (response.status === 0) {
        await NativeVaultManager.setCurrentVaultRevisionNumber(response.newRevisionNumber);
        options.onSuccess?.();
      } else if (response.status === 1) {
        throw new Error('Vault merge required. Please login via the web app to merge the multiple pending updates to your vault.');
      } else {
        throw new Error('Failed to upload vault to server');
      }
    } catch (error) {
      // Check if it's a network error
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('timeout'))) {
        // Network error, mark as offline and track pending changes
        authContext.setOfflineMode(true);
        options.onSuccess?.();
        return;
      }
      throw error;
    }
  }, [dbContext, authContext, webApi]);

  const executeVaultMutation = useCallback(async (
    operation: () => Promise<void>,
    options: VaultMutationOptions = {}
  ) => {
    try {
      setIsLoading(true);
      setSyncStatus('Checking for vault updates');

      // If we're in offline mode, try to sync once to see if we can get back online
      if (authContext.isOffline) {
        await syncVault({
          /**
           * Handle the status update.
           */
          onStatus: (message) => setSyncStatus(message),
          /**
           * Handle successful vault sync and continue with vault mutation.
           */
          onSuccess: async (hasNewVault) => {
            if (hasNewVault) {
              // Vault was changed, but has now been reloaded so we can continue with the operation.
            }
            await executeOperation(operation, options);
          },
          /**
           * Handle offline state and prompt user for action.
           */
          onError: () => {
            // Still offline, proceed with local operation
            executeOperation(operation, options);
          }
        });
      } else {
        await syncVault({
          /**
           * Handle the status update.
           */
          onStatus: (message) => setSyncStatus(message),
          /**
           * Handle successful vault sync and continue with vault mutation.
           */
          onSuccess: async (hasNewVault) => {
            if (hasNewVault) {
              // Vault was changed, but has now been reloaded so we can continue with the operation.
            }
            await executeOperation(operation, options);
          },
          /**
           * Handle error during vault sync.
           */
          onError: (error) => {
            Toast.show({
              type: 'error',
              text1: 'Failed to sync vault',
              text2: error,
              position: 'bottom'
            });
            options.onError?.(new Error(error));
          }
        });
      }
    } catch (error) {
      console.error('Error during vault mutation:', error);
      Toast.show({
        type: 'error',
        text1: 'Operation failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
        position: 'bottom'
      });
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setSyncStatus('');
    }
  }, [syncVault, executeOperation, authContext.isOffline]);

  return {
    executeVaultMutation,
    isLoading,
    syncStatus
  };
}
