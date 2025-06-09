import { useCallback, useState } from 'react';
import { sendMessage } from 'webext-bridge/popup';

import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useVaultSync } from '@/entrypoints/popup/hooks/useVaultSync';

import { VaultUploadResponse as messageVaultUploadResponse } from '@/utils/types/messaging/VaultUploadResponse';

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
  const dbContext = useDb();
  const { syncVault } = useVaultSync();

  /**
   * Execute the provided operation (e.g. create/update/delete credential)
   */
  const executeMutateOperation = useCallback(async (
    operation: () => Promise<void>,
    options: VaultMutationOptions
  ) : Promise<void> => {
    setSyncStatus('Saving changes to vault');

    // Execute the provided operation (e.g. create/update/delete credential)
    await operation();

    setSyncStatus('Uploading vault to server');

    try {
      // Trigger the background worker to upload the current vault to the server
      const response = await sendMessage('UPLOAD_VAULT', {}, 'background') as messageVaultUploadResponse;

      /*
       * If we get here, it means we have a valid connection to the server.
       * TODO: offline mode is not implemented for browser extension yet.
       * authContext.setOfflineMode(false);
       */

      if (response.status === 0 && response.newRevisionNumber) {
        await dbContext.setCurrentVaultRevisionNumber(response.newRevisionNumber);
        options.onSuccess?.();
      } else if (response.status === 1) {
        throw new Error('Vault merge required. Please login via the web app to merge the multiple pending updates to your vault.');
      } else {
        throw new Error('Failed to upload vault to server');
      }
    } catch (error) {
      // Check if it's a network error
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('timeout'))) {
        /*
         * Network error, mark as offline and track pending changes
         * TODO: offline mode is not implemented for browser extension yet.
         * authContext.setOfflineMode(true);
         */
        options.onError?.(new Error('Network error'));
        return;
      }
      throw error;
    }
  }, [dbContext]);

  /**
   * Hook to execute a vault mutation which uploads a new encrypted vault to the server
   */
  const executeVaultMutation = useCallback(async (
    operation: () => Promise<void>,
    options: VaultMutationOptions = {}
  ) => {
    try {
      setIsLoading(true);
      setSyncStatus('Checking for vault updates');

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
          await executeMutateOperation(operation, options);
        },
        /**
         * Handle error during vault sync.
         */
        onError: (error) => {
          /**
           *Toast.show({
           *type: 'error',
           *text1: 'Failed to sync vault',
           *text2: error,
           *position: 'bottom'
           *});
           */
          options.onError?.(new Error(error));
        }
      });
    } catch (error) {
      console.error('Error during vault mutation:', error);
      /*
       * Toast.show({
       *type: 'error',
       *text1: 'Operation failed',
       *text2: error instanceof Error ? error.message : 'Unknown error',
       *position: 'bottom'
       *});
       */
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      setSyncStatus('');
    }
  }, [syncVault, executeMutateOperation]);

  return {
    executeVaultMutation,
    isLoading,
    syncStatus,
  };
}