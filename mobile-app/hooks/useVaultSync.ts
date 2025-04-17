import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { VaultResponse } from '@/utils/types/webapi/VaultResponse';

interface VaultSyncOptions {
  forceCheck?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useVaultSync = () => {
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();

  const syncVault = useCallback(async (options: VaultSyncOptions = {}) => {
    const { forceCheck = false, onSuccess, onError } = options;
    console.log('syncVault called with forceCheck:', forceCheck);

    try {
      const isLoggedIn = await authContext.initializeAuth();

      if (!isLoggedIn) {
        console.log('Vault sync: Not authenticated');
        return false;
      }

      // If not forcing a check, verify the time elapsed since last check
      if (!forceCheck) {
        const lastCheckStr = await AsyncStorage.getItem('lastVaultCheck');
        const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : 0;
        const now = Date.now();

        // Only check if more than 1 hour has passed since last check
        if (now - lastCheck < 3600000) {
          console.log('Vault sync skipped: Not enough time has passed since last check');
          return false;
        }
      }

      console.log('Checking vault updates');

      // Update last check time
      await AsyncStorage.setItem('lastVaultCheck', Date.now().toString());

      // Check app status and vault revision
      const statusResponse = await webApi.getStatus();
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

      if (statusResponse.vaultRevision > vaultRevisionNumber) {
        const vaultResponseJson = await webApi.get<VaultResponse>('Vault');

        const vaultError = webApi.validateVaultResponse(vaultResponseJson as VaultResponse);
        if (vaultError) {
          console.log('Vault sync error:', vaultError);
          await webApi.logout(vaultError);
          onError?.(vaultError);
          return false;
        }

        console.log('Re-initializing database with new vault');
        await dbContext.initializeDatabase(vaultResponseJson as VaultResponse, null);
        onSuccess?.();
        return true;
      }

      console.log('Vault sync finished: No updates needed');
      onSuccess?.();
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