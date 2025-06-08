import { useCallback } from 'react';

import { useAuth } from '@/entrypoints/popup/context/AuthContext';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useWebApi } from '@/entrypoints/popup/context/WebApiContext';

import { AppInfo } from '@/utils/AppInfo';
import type { VaultResponse } from '@/utils/shared/models';

/**
 * Utility function to ensure a minimum time has elapsed for an operation
 */
const withMinimumDelay = async <T>(
  operation: () => Promise<T>,
  minDelayMs: number,
  initialSync: boolean
): Promise<T> => {
  if (!initialSync) {
    return operation();
  }

  const startTime = Date.now();
  const result = await operation();
  const elapsedTime = Date.now() - startTime;

  if (elapsedTime < minDelayMs) {
    await new Promise(resolve => setTimeout(resolve, minDelayMs - elapsedTime));
  }

  return result;
};

type VaultSyncOptions = {
  initialSync?: boolean;
  onSuccess?: (hasNewVault: boolean) => void;
  onError?: (error: string) => void;
  onStatus?: (message: string) => void;
  onOffline?: () => void;
}

/**
 * Hook to sync the vault with the server.
 */
export const useVaultSync = () : {
  syncVault: (options?: VaultSyncOptions) => Promise<boolean>;
} => {
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();

  const syncVault = useCallback(async (options: VaultSyncOptions = {}) => {
    const { initialSync = false, onSuccess, onError, onStatus, onOffline } = options;

    try {
      const { isLoggedIn } = await authContext.initializeAuth();

      if (!isLoggedIn) {
        // Not authenticated, return false immediately
        return false;
      }

      // Check app status and vault revision
      onStatus?.('Checking vault updates');
      const statusResponse = await withMinimumDelay(
        () => webApi.getStatus(),
        300,
        initialSync
      );

      if (statusResponse.serverVersion === '0.0.0') {
        // Server is not available, go into offline mode
        onOffline?.();
        return false;
      }

      if (!statusResponse.clientVersionSupported) {
        const statusError = 'This version of the AliasVault mobile app is not supported by the server anymore. Please update your app to the latest version.';
        onError?.(statusError);
        return false;
      }

      if (!AppInfo.isServerVersionSupported(statusResponse.serverVersion)) {
        const statusError = 'The AliasVault server needs to be updated to a newer version in order to use this mobile app. Please contact support if you need help.';
        onError?.(statusError);
        return false;
      }

      /*
       *  If we get here, it means we have a valid connection to the server.
       *  TODO: browser extension does not support offline mode yet.
       * authContext.setOfflineMode(false);
       */

      // Compare vault revisions
      const vaultMetadata = await dbContext.getVaultMetadata();
      const vaultRevisionNumber = vaultMetadata?.vaultRevisionNumber ?? 0;

      if (statusResponse.vaultRevision > vaultRevisionNumber) {
        onStatus?.('Syncing updated vault');
        const vaultResponseJson = await withMinimumDelay(
          () => webApi.get<VaultResponse>('Vault'),
          1000,
          initialSync
        );

        const vaultError = webApi.validateVaultResponse(vaultResponseJson as VaultResponse);
        if (vaultError) {
          // Only logout if it's an authentication error, not a network error
          if (vaultError.includes('authentication') || vaultError.includes('unauthorized')) {
            await webApi.logout(vaultError);
            onError?.(vaultError);
            return false;
          }

          /*
           *  TODO: browser extension does not support offline mode yet.
           *  For other errors, go into offline mode
           * authContext.setOfflineMode(true);
           */

          return false;
        }

        try {
          await dbContext.initializeDatabase(vaultResponseJson as VaultResponse);
          onSuccess?.(true);
          return true;
        } catch {
          // Vault could not be decrypted, throw an error
          throw new Error('Vault could not be decrypted, if problem persists please logout and login again.');
        }
      }

      await withMinimumDelay(
        () => Promise.resolve(onSuccess?.(false)),
        300,
        initialSync
      );
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during vault sync';
      console.error('Vault sync error:', err);

      /*
       * Check if it's a network error
       * TODO: browser extension does not support offline mode yet.
       */
      /*
       * if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
       *authContext.setOfflineMode(true);
       *return true;
       *}
       */

      onError?.(errorMessage);
      return false;
    }
  }, [authContext, dbContext, webApi]);

  return { syncVault };
};