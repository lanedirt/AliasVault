import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { VaultResponse } from '@/utils/types/webapi/VaultResponse';

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
    const { initialSync = false, onSuccess, onError, onStatus } = options;

    try {
      const { isLoggedIn } = await authContext.initializeAuth();

      if (!isLoggedIn) {
        // Not authenticated, return false immediately
        return false;
      }

      // Update last check time
      await AsyncStorage.setItem('lastVaultCheck', Date.now().toString());

      // Check app status and vault revision
      onStatus?.('Checking vault updates');
      const statusResponse = await withMinimumDelay(
        () => webApi.getStatus(),
        300,
        initialSync
      );
      const statusError = webApi.validateStatusResponse(statusResponse);
      if (statusError !== null) {
        await webApi.logout(statusError);
        onError?.(statusError);
        return false;
      }

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
          await webApi.logout(vaultError);
          onError?.(vaultError);
          return false;
        }

        try {
          await dbContext.initializeDatabase(vaultResponseJson as VaultResponse, null);
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
      onError?.(errorMessage);
      return false;
    }
  }, [authContext, dbContext, webApi]);

  return { syncVault };
};