import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { sendMessage } from 'webext-bridge/popup';

import { useAuth } from '@/entrypoints/popup/context/AuthContext';
import { useDb } from '@/entrypoints/popup/context/DbContext';
import { useWebApi } from '@/entrypoints/popup/context/WebApiContext';

import type { VaultResponse } from '@/utils/dist/shared/models/webapi';

/**
 * Utility function to ensure a minimum time has elapsed for an operation
 */
const withMinimumDelay = async <T>(
  operation: () => Promise<T>,
  minDelayMs: number,
  enableDelay: boolean = true
): Promise<T> => {
  if (!enableDelay) {
    // If delay is disabled, return the result immediately.
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
  _onOffline?: () => void;
  onUpgradeRequired?: () => void;
}

/**
 * Hook to sync the vault with the server.
 */
export const useVaultSync = () : {
  syncVault: (options?: VaultSyncOptions) => Promise<boolean>;
} => {
  const { t } = useTranslation();
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();

  const syncVault = useCallback(async (options: VaultSyncOptions = {}) => {
    const { initialSync = false, onSuccess, onError, onStatus, _onOffline, onUpgradeRequired } = options;

    // For the initial sync, we add an artifical delay to various steps which makes it feel more fluid.
    const enableDelay = initialSync;

    try {
      const { isLoggedIn } = await authContext.initializeAuth();

      if (!isLoggedIn) {
        // Not authenticated, return false immediately
        return false;
      }

      // Check app status and vault revision
      onStatus?.(t('common.checkingVaultUpdates'));
      const statusResponse = await withMinimumDelay(() => webApi.getStatus(), 300, enableDelay);

      // Check if server is actually available, 0.0.0 indicates connection error which triggers offline mode.
      if (statusResponse.serverVersion === '0.0.0') {
        // Offline mode is not implemented for browser extension yet, let it fail below due to the validateStatusResponse check.
      }

      const statusError = webApi.validateStatusResponse(statusResponse);
      if (statusError) {
        onError?.(t('common.errors.' + statusError));
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
        onStatus?.(t('common.syncingUpdatedVault'));
        const vaultResponseJson = await withMinimumDelay(() => webApi.get<VaultResponse>('Vault'), 1000, enableDelay);

        const vaultError = webApi.validateVaultResponse(vaultResponseJson as VaultResponse, t);
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
          // Get derived key from background worker
          const passwordHashBase64 = await sendMessage('GET_DERIVED_KEY', {}, 'background') as string;
          const sqliteClient = await dbContext.initializeDatabase(vaultResponseJson as VaultResponse, passwordHashBase64);

          // Check if the current vault version is known and up to date, if not known trigger an exception, if not up to date redirect to the upgrade page.
          if (await sqliteClient.hasPendingMigrations()) {
            onUpgradeRequired?.();
            return false;
          }

          onSuccess?.(true);
          return true;
        } catch (error) {
          // Check if it's a version-related error (app needs to be updated)
          if (error instanceof Error && error.message.includes('This browser extension is outdated')) {
            await webApi.logout(error.message);
            onError?.(error.message);
            return false;
          }
          // Vault could not be decrypted, throw an error
          throw new Error('Vault could not be decrypted, if the problem persists please logout and login again.');
        }
      }

      // Check if the vault is up to date, if not, redirect to the upgrade page.
      if (await dbContext.hasPendingMigrations()) {
        onUpgradeRequired?.();
        return false;
      }

      await withMinimumDelay(() => Promise.resolve(onSuccess?.(false)), 300, enableDelay);
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during vault sync';
      console.error('Vault sync error:', err);

      // Check if it's a version-related error (app needs to be updated)
      if (errorMessage.includes('This browser extension is outdated')) {
        await webApi.logout(errorMessage);
        onError?.(errorMessage);
        return false;
      }

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
  }, [authContext, dbContext, webApi, t]);

  return { syncVault };
};