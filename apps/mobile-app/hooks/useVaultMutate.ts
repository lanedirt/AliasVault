import { useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useWebApi } from '@/context/WebApiContext';
import { useVaultSync } from './useVaultSync';
import NativeVaultManager from '@/specs/NativeVaultManager';
import Toast from 'react-native-toast-message';

interface VaultPostResponse {
  status: number;
  newRevisionNumber: number;
}

interface VaultMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useVaultMutate() {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const authContext = useAuth();
  const dbContext = useDb();
  const webApi = useWebApi();
  const { syncVault } = useVaultSync();

  const executeVaultMutation = useCallback(async (
    operation: () => Promise<void>,
    options: VaultMutationOptions = {}
  ) => {
    try {
      setIsLoading(true);
      setSyncStatus('Checking for vault updates...');

      await syncVault({
        onStatus: (message) => setSyncStatus(message),
        onSuccess: async (hasNewVault) => {
          if (hasNewVault) {
            console.log('Vault was changed, but has now been reloaded so we can continue with the operation.');
          }
          await executeOperation(operation, options);
        },
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
  }, [syncVault]);

  const executeOperation = async (
    operation: () => Promise<void>,
    options: VaultMutationOptions
  ) => {
    setSyncStatus('Saving changes to vault...');

    // Execute the provided operation (e.g. create/update/delete credential)
    await operation();

    // Get the current vault revision number
    const currentRevision = await NativeVaultManager.getCurrentVaultRevisionNumber();

    // Get the encrypted database
    console.log('Getting encrypted database new version');
    const encryptedDb = await NativeVaultManager.getEncryptedDatabase();
    if (!encryptedDb) {
      throw new Error('Failed to get encrypted database');
    }

    setSyncStatus('Uploading vault to server...');

    // Get email addresses from credentials
    const credentials = await dbContext.sqliteClient!.getAllCredentials();
    const emailAddresses = credentials
      .filter(cred => cred.Alias?.Email != null)
      .map(cred => cred.Alias!.Email!)
      .filter((email, index, self) => self.indexOf(email) === index);

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
      emailAddressList: emailAddresses,
      privateEmailDomainList: [], // Empty on purpose, API will not use this for vault updates
      publicEmailDomainList: [], // Empty on purpose, API will not use this for vault updates
      encryptionPublicKey: '', // Empty on purpose, only required if new public/private key pair is generated
      client: '', // Empty on purpose, API will not use this for vault updates
      updatedAt: new Date().toISOString(),
      username: username,
      version: await dbContext.sqliteClient!.getDatabaseVersion() ?? '0.0.0'
    };

    // Upload to server
    const response = await webApi.post<typeof newVault, VaultPostResponse>('Vault', newVault);

    console.log('Vault upload response:', response);

    if (response.status === 0) {
      await NativeVaultManager.setCurrentVaultRevisionNumber(response.newRevisionNumber);
      options.onSuccess?.();
    } else if (response.status === 1) {
      throw new Error('Vault merge required. Please login via the web app to merge the multiple pending updates to your vault.');
    } else {
      throw new Error('Failed to upload vault to server');
    }
  };

  return {
    executeVaultMutation,
    isLoading,
    syncStatus
  };
}
