import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { VaultResponse } from '@/utils/types/webapi/VaultResponse';

// Utility function to ensure a minimum time has elapsed for an operation
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

interface VaultSyncOptions {
  initialSync?: boolean;
  onSuccess?: (hasNewVault: boolean) => void;
  onError?: (error: string) => void;
  onStatus?: (message: string) => void;
}

export const useVaultSync = () => {
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();

  const syncVault = useCallback(async (options: VaultSyncOptions = {}) => {
    const { initialSync = false, onSuccess, onError, onStatus } = options;
    console.log('syncVault called with initialSync:', initialSync);

    try {
      const isLoggedIn = await authContext.initializeAuth();

      if (!isLoggedIn) {
        console.log('Vault sync: Not authenticated');
        return false;
      }

      console.log('Checking vault updates');

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
        console.log('Vault sync error:', statusError);
        await webApi.logout(statusError);
        onError?.(statusError);
        return false;
      }

      // Compare vault revisions
      const vaultMetadata = await dbContext.getVaultMetadata();
      const vaultRevisionNumber = vaultMetadata?.vaultRevisionNumber ?? 0;

      console.log('Vault revision local:', vaultRevisionNumber);
      console.log('Vault revision server:', statusResponse.vaultRevision);
      if (statusResponse.vaultRevision > vaultRevisionNumber) {
        onStatus?.('Syncing updated vault');
        const vaultResponseJson = await withMinimumDelay(
          () => webApi.get<VaultResponse>('Vault'),
          1000,
          initialSync
        );

        const vaultError = webApi.validateVaultResponse(vaultResponseJson as VaultResponse);
        if (vaultError) {
          console.log('Vault sync error:', vaultError);
          await webApi.logout(vaultError);
          onError?.(vaultError);
          return false;
        }

        console.log('Re-initializing database with new vault');
        dbContext.initializeDatabase(vaultResponseJson as VaultResponse, null);
        onSuccess?.(true);
        return true;
      }

      console.log('Vault sync finished: No updates needed');
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