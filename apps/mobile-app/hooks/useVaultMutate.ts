import { useCallback, useState } from 'react';
import Toast from 'react-native-toast-message';
import srp from 'secure-remote-password/client';

import EncryptionUtility from '@/utils/EncryptionUtility';
import type { PasswordChangeInitiateResponse, Vault, VaultPasswordChangeRequest } from '@/utils/shared/models/webapi';
import { EncryptionKeyDerivationParams } from '@/utils/types/messaging/EncryptionKeyDerivationParams';

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
  executeVaultPasswordChange: (currentPasswordHashBase64: string, newPasswordPlainText: string, options?: VaultMutationOptions) => Promise<void>;
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
   * Prepare the vault for upload, returns the new vault object with the updated revision number and encrypted database.
   */
  const prepareVault = useCallback(async () : Promise<Vault> => {
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
    return {
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
  }, [dbContext, authContext]);

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
    const newVault = await prepareVault();

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
  }, [authContext, webApi, prepareVault]);

  /**
   * Execute the provided operation (e.g. create/update/delete credential)
   */
  const executePasswordChangeOperation = useCallback(async (
    currentPasswordHashBase64: string,
    newPasswordPlainText: string,
    options: VaultMutationOptions
  ) : Promise<void> => {
    setSyncStatus('Saving changes to vault');

    const data = await webApi.authFetch<PasswordChangeInitiateResponse>('Auth/change-password/initiate');
    const currentSalt = data.salt;
    const currentServerEphemeral = data.serverEphemeral;

    // Convert base64 string to hex string
    const currentPasswordHashString = Buffer.from(currentPasswordHashBase64, 'base64').toString('hex').toUpperCase();

    // Generate client ephemeral and session
    const newClientEphemeral = srp.generateEphemeral();
    // Get username from the auth context, always lowercase and trimmed which is required for the argon2id key derivation
    const username = authContext.username?.toLowerCase().trim();
    if (!username) {
      throw new Error('Username not found. Please login again.');
    }

    const privateKey = srp.derivePrivateKey(currentSalt, username, currentPasswordHashString);
    const newClientSession = srp.deriveSession(
      newClientEphemeral.secret,
      currentServerEphemeral,
      currentSalt,
      username,
      privateKey
    );

    // Generate salt and verifier for new password
    const newSalt = srp.generateSalt();
    const newPasswordHash = await EncryptionUtility.deriveKeyFromPassword(newPasswordPlainText, newSalt, data.encryptionType, data.encryptionSettings);
    const newPasswordHashString = Buffer.from(newPasswordHash).toString('hex').toUpperCase();

    // Store the new encryption key and derivation parameters locally
    try {
      const newEncryptionKeyDerivationParams : EncryptionKeyDerivationParams = {
        encryptionType: data.encryptionType,
        encryptionSettings: data.encryptionSettings,
        salt: newSalt,
      };

      await dbContext.storeEncryptionKey(Buffer.from(newPasswordHash).toString('base64'));
      await dbContext.storeEncryptionKeyDerivationParams(newEncryptionKeyDerivationParams);

      /**
       * Persist the new encrypted database with the new encryption key by starting and committing a transaction.
       * which simulates a vault mutation operation. As part of this operation, a new encrypted database is created
       * locally which can then be uploaded to the server.
       */
      await NativeVaultManager.beginTransaction();
      await NativeVaultManager.commitTransaction();

      // Unlock the newly persisted database to ensure it works and the new encryption key will be persisted in the keychain.
      await NativeVaultManager.unlockVault();
    } catch {
      // If any part of this fails, we need logout the user as the local vault and stored encryption key are now potentially corrupt.
      authContext.logout('Error during password change operation. Please log in again to retrieve your latest vault.');
    }

    // Generate SRP password change data
    const newPrivateKey = srp.derivePrivateKey(newSalt, username, newPasswordHashString);
    const newVerifier = srp.deriveVerifier(newPrivateKey);

    // Get the current vault revision number
    const vault = await prepareVault();
    setSyncStatus('Uploading vault to server');

    // Convert default vault object to password change vault object
    const passwordChangeVault : VaultPasswordChangeRequest = {
      ...vault,
      currentClientPublicEphemeral: newClientEphemeral.public,
      currentClientSessionProof: newClientSession.proof,
      newPasswordSalt: newSalt,
      newPasswordVerifier: newVerifier
    };

    try {
      // Upload to server
      const response = await webApi.post<typeof passwordChangeVault, VaultPostResponse>('Vault/change-password', passwordChangeVault);

      /**
       * Determine if the server responds with vault revision number, as API < 0.17.0 did not.
       * TODO: Remove this once we have a minimum required API version of 0.17.0.
       */
      const newRevisionNumber = response.newRevisionNumber ?? passwordChangeVault.currentRevisionNumber + 1;

      // If we get here, it means we have a valid connection to the server.
      authContext.setOfflineMode(false);

      await NativeVaultManager.setCurrentVaultRevisionNumber(newRevisionNumber);
      options.onSuccess?.();
    } catch (error) {
      console.error('Error during password change operation:', error);
      throw error;
    }
  }, [dbContext, authContext, webApi, prepareVault]);

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
            await executeMutateOperation(operation, options);
          },
          /**
           * Handle offline state and prompt user for action.
           */
          onError: () => {
            // Still offline, proceed with local operation
            executeMutateOperation(operation, options);
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
            await executeMutateOperation(operation, options);
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
  }, [syncVault, executeMutateOperation, authContext.isOffline]);

  /**
   * Hook to execute a password change which uploads a new encrypted vault to the server
   * with updated SRP verifier and salt. It shares common logic with the regular vault mutation upload.
   */
  const executeVaultPasswordChange = useCallback(async (
    currentPasswordHashBase64: string,
    newPasswordPlainText: string,
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
            await executePasswordChangeOperation(currentPasswordHashBase64, newPasswordPlainText, options);
          },
          /**
           * Handle offline state and prompt user for action.
           */
          onError: () => {
            // Still offline, proceed with local operation
            executePasswordChangeOperation(currentPasswordHashBase64, newPasswordPlainText, options);
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
            await executePasswordChangeOperation(currentPasswordHashBase64, newPasswordPlainText, options);
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
  }, [syncVault, executePasswordChangeOperation, authContext.isOffline]);

  return {
    executeVaultMutation,
    executeVaultPasswordChange,
    isLoading,
    syncStatus
  };
}
