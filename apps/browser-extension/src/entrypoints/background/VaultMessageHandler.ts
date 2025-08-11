/* eslint-disable @typescript-eslint/no-explicit-any */
import { storage } from 'wxt/utils/storage';

import type { Vault, VaultResponse, VaultPostResponse } from '@/utils/dist/shared/models/webapi';
import { EncryptionUtility } from '@/utils/EncryptionUtility';
import { SqliteClient } from '@/utils/SqliteClient';
import { BoolResponse as messageBoolResponse } from '@/utils/types/messaging/BoolResponse';
import { CredentialsResponse as messageCredentialsResponse } from '@/utils/types/messaging/CredentialsResponse';
import { IdentitySettingsResponse } from '@/utils/types/messaging/IdentitySettingsResponse';
import { PasswordSettingsResponse as messagePasswordSettingsResponse } from '@/utils/types/messaging/PasswordSettingsResponse';
import { StoreVaultRequest } from '@/utils/types/messaging/StoreVaultRequest';
import { StringResponse as stringResponse } from '@/utils/types/messaging/StringResponse';
import { VaultResponse as messageVaultResponse } from '@/utils/types/messaging/VaultResponse';
import { VaultUploadResponse as messageVaultUploadResponse } from '@/utils/types/messaging/VaultUploadResponse';
import { WebApiService } from '@/utils/WebApiService';

import { t } from '@/i18n/StandaloneI18n';

/**
 * Check if the user is logged in and if the vault is locked, and also check for pending migrations.
 */
export async function handleCheckAuthStatus() : Promise<{ isLoggedIn: boolean, isVaultLocked: boolean, hasPendingMigrations: boolean, error?: string }> {
  const username = await storage.getItem('local:username');
  const accessToken = await storage.getItem('local:accessToken');
  const vaultData = await storage.getItem('session:encryptedVault');

  const isLoggedIn = username !== null && accessToken !== null;
  const isVaultLocked = isLoggedIn && vaultData === null;

  // If vault is locked, we can't check for pending migrations
  if (isVaultLocked) {
    return {
      isLoggedIn,
      isVaultLocked,
      hasPendingMigrations: false
    };
  }

  // If not logged in, no need to check migrations
  if (!isLoggedIn) {
    return {
      isLoggedIn,
      isVaultLocked,
      hasPendingMigrations: false
    };
  }

  // Vault is unlocked, check for pending migrations
  try {
    const sqliteClient = await createVaultSqliteClient();
    const hasPendingMigrations = await sqliteClient.hasPendingMigrations();
    return {
      isLoggedIn,
      isVaultLocked,
      hasPendingMigrations
    };
  } catch (error) {
    console.error('Error checking pending migrations:', error);
    return {
      isLoggedIn,
      isVaultLocked,
      hasPendingMigrations: false,
      error: error instanceof Error ? error.message : await t('common.errors.unknownError')
    };
  }
}

/**
 * Store the vault in browser storage.
 */
export async function handleStoreVault(
  message: any,
) : Promise<messageBoolResponse> {
  try {
    const vaultRequest = message as StoreVaultRequest;

    // Store new encrypted vault in session storage.
    await storage.setItem('session:encryptedVault', vaultRequest.vaultBlob);

    /*
     * For all other values, check if they have a value and store them in session storage if they do.
     * Some updates, e.g. when mutating local database, these values will not be set.
     */

    // Store derived key in session storage (if it has a value)
    if (vaultRequest.derivedKey) {
      await storage.setItem('session:derivedKey', vaultRequest.derivedKey);
    }

    if (vaultRequest.publicEmailDomainList) {
      await storage.setItem('session:publicEmailDomains', vaultRequest.publicEmailDomainList);
    }

    if (vaultRequest.privateEmailDomainList) {
      await storage.setItem('session:privateEmailDomains', vaultRequest.privateEmailDomainList);
    }

    if (vaultRequest.vaultRevisionNumber) {
      await storage.setItem('session:vaultRevisionNumber', vaultRequest.vaultRevisionNumber);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to store vault:', error);
    return { success: false, error: await t('common.errors.failedToStoreVault') };
  }
}

/**
 * Sync the vault with the server to check if a newer vault is available. If so, the vault will be updated.
 */
export async function handleSyncVault(
) : Promise<messageBoolResponse> {
  const webApi = new WebApiService(() => {});
  const statusResponse = await webApi.getStatus();
  const statusError = webApi.validateStatusResponse(statusResponse);
  if (statusError !== null) {
    return { success: false, error: await t('common.errors.' + statusError) };
  }

  const vaultRevisionNumber = await storage.getItem('session:vaultRevisionNumber') as number;

  if (statusResponse.vaultRevision > vaultRevisionNumber) {
    // Retrieve the latest vault from the server.
    const vaultResponse = await webApi.get<VaultResponse>('Vault');

    await storage.setItems([
      { key: 'session:encryptedVault', value: vaultResponse.vault.blob },
      { key: 'session:publicEmailDomains', value: vaultResponse.vault.publicEmailDomainList },
      { key: 'session:privateEmailDomains', value: vaultResponse.vault.privateEmailDomainList },
      { key: 'session:vaultRevisionNumber', value: vaultResponse.vault.currentRevisionNumber }
    ]);
  }

  return { success: true };
}

/**
 * Get the vault from browser storage.
 */
export async function handleGetVault(
) : Promise<messageVaultResponse> {
  try {
    const encryptedVault = await storage.getItem('session:encryptedVault') as string;
    const derivedKey = await storage.getItem('session:derivedKey') as string;
    const publicEmailDomains = await storage.getItem('session:publicEmailDomains') as string[];
    const privateEmailDomains = await storage.getItem('session:privateEmailDomains') as string[];
    const vaultRevisionNumber = await storage.getItem('session:vaultRevisionNumber') as number;

    if (!encryptedVault) {
      console.error('Vault not available');
      return { success: false, error: await t('common.errors.vaultNotAvailable') };
    }

    const decryptedVault = await EncryptionUtility.symmetricDecrypt(
      encryptedVault,
      derivedKey
    );

    return {
      success: true,
      vault: decryptedVault,
      publicEmailDomains: publicEmailDomains ?? [],
      privateEmailDomains: privateEmailDomains ?? [],
      vaultRevisionNumber: vaultRevisionNumber ?? 0
    };
  } catch (error) {
    console.error('Failed to get vault:', error);
    return { success: false, error: await t('common.errors.failedToGetVault') };
  }
}

/**
 * Clear the vault from browser storage.
 */
export function handleClearVault(
) : messageBoolResponse {
  storage.removeItems([
    'session:encryptedVault',
    'session:derivedKey',
    'session:publicEmailDomains',
    'session:privateEmailDomains',
    'session:vaultRevisionNumber'
  ]);

  return { success: true };
}

/**
 * Get all credentials.
 */
export async function handleGetCredentials(
) : Promise<messageCredentialsResponse> {
  const derivedKey = await storage.getItem('session:derivedKey') as string;

  if (!derivedKey) {
    return { success: false, error: await t('common.errors.vaultIsLocked') };
  }

  try {
    const sqliteClient = await createVaultSqliteClient();
    const credentials = sqliteClient.getAllCredentials();
    return { success: true, credentials: credentials };
  } catch (error) {
    console.error('Error getting credentials:', error);
    return { success: false, error: await t('common.errors.failedToGetCredentials') };
  }
}

/**
 * Create an identity.
 */
export async function handleCreateIdentity(
  message: any,
) : Promise<messageBoolResponse> {
  const derivedKey = await storage.getItem('session:derivedKey') as string;

  if (!derivedKey) {
    return { success: false, error: await t('common.errors.vaultIsLocked') };
  }

  try {
    const sqliteClient = await createVaultSqliteClient();

    // Add the new credential to the vault/database.
    sqliteClient.createCredential(message.credential);

    // Upload the new vault to the server.
    await uploadNewVaultToServer(sqliteClient);

    return { success: true };
  } catch (error) {
    console.error('Failed to create identity:', error);
    return { success: false, error: await t('common.errors.failedToCreateIdentity') };
  }
}

/**
 * Get the email addresses for a vault.
 */
export async function getEmailAddressesForVault(
  sqliteClient: SqliteClient
): Promise<string[]> {
  // TODO: create separate query to only get email addresses to avoid loading all credentials.
  const credentials = sqliteClient.getAllCredentials();

  // Get metadata from storage
  const privateEmailDomains = await storage.getItem('session:privateEmailDomains') as string[];

  const emailAddresses = credentials
    .filter(cred => cred.Alias?.Email != null)
    .map(cred => cred.Alias.Email ?? '')
    .filter((email, index, self) => self.indexOf(email) === index);

  return emailAddresses.filter(email => {
    const domain = email?.split('@')[1];
    return domain && privateEmailDomains.includes(domain);
  });
}

/**
 * Get default email domain for a vault.
 */
export function handleGetDefaultEmailDomain(): Promise<stringResponse> {
  return (async (): Promise<stringResponse> => {
    try {
      const privateEmailDomains = await storage.getItem('session:privateEmailDomains') as string[];
      const publicEmailDomains = await storage.getItem('session:publicEmailDomains') as string[];

      const sqliteClient = await createVaultSqliteClient();
      const defaultEmailDomain = sqliteClient.getDefaultEmailDomain(privateEmailDomains, publicEmailDomains);

      return { success: true, value: defaultEmailDomain ?? undefined };
    } catch (error) {
      console.error('Error getting default email domain:', error);
      return { success: false, error: await t('common.errors.failedToGetDefaultEmailDomain') };
    }
  })();
}

/**
 * Get the default identity settings.
 */
export async function handleGetDefaultIdentitySettings(
) : Promise<IdentitySettingsResponse> {
  try {
    const sqliteClient = await createVaultSqliteClient();
    const language = sqliteClient.getDefaultIdentityLanguage();
    const gender = sqliteClient.getDefaultIdentityGender();

    return {
      success: true,
      settings: {
        language,
        gender
      }
    };
  } catch (error) {
    console.error('Error getting default identity settings:', error);
    return { success: false, error: await t('common.errors.failedToGetDefaultIdentitySettings') };
  }
}

/**
 * Get the password settings.
 */
export async function handleGetPasswordSettings(
) : Promise<messagePasswordSettingsResponse> {
  try {
    const sqliteClient = await createVaultSqliteClient();
    const passwordSettings = sqliteClient.getPasswordSettings();

    return { success: true, settings: passwordSettings };
  } catch (error) {
    console.error('Error getting password settings:', error);
    return { success: false, error: await t('common.errors.failedToGetPasswordSettings') };
  }
}

/**
 * Get the derived key for the encrypted vault.
 */
export async function handleGetDerivedKey(
) : Promise<string> {
  const derivedKey = await storage.getItem('session:derivedKey') as string;
  return derivedKey;
}

/**
 * Upload the vault to the server.
 */
export async function handleUploadVault(
  message: any
) : Promise<messageVaultUploadResponse> {
  try {
    // Store the new vault blob in session storage.
    await storage.setItem('session:encryptedVault', message.vaultBlob);

    // Create new sqlite client which will use the new vault blob.
    const sqliteClient = await createVaultSqliteClient();

    // Upload the new vault to the server.
    const response = await uploadNewVaultToServer(sqliteClient);
    return { success: true, status: response.status, newRevisionNumber: response.newRevisionNumber };
  } catch (error) {
    console.error('Failed to upload vault:', error);
    return { success: false, error: await t('common.errors.failedToUploadVault') };
  }
}

/**
 * Handle persisting form values to storage.
 * Data is encrypted using the derived key for additional security.
 */
export async function handlePersistFormValues(data: any): Promise<void> {
  const derivedKey = await storage.getItem('session:derivedKey') as string;
  if (!derivedKey) {
    throw new Error(await t('common.errors.unknownError'));
  }

  // Always stringify the data properly
  const serializedData = JSON.stringify(data);
  const encryptedData = await EncryptionUtility.symmetricEncrypt(
    serializedData,
    derivedKey
  );
  await storage.setItem('session:persistedFormValues', encryptedData);
}

/**
 * Handle retrieving persisted form values from storage.
 * Data is decrypted using the derived key.
 */
export async function handleGetPersistedFormValues(): Promise<any | null> {
  const derivedKey = await storage.getItem('session:derivedKey') as string;
  const encryptedData = await storage.getItem('session:persistedFormValues') as string | null;

  if (!encryptedData || !derivedKey) {
    return null;
  }

  try {
    const decryptedData = await EncryptionUtility.symmetricDecrypt(
      encryptedData,
      derivedKey
    );
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Failed to decrypt or parse persisted form values:', error);
    return null;
  }
}

/**
 * Handle clearing persisted form values from storage.
 */
export async function handleClearPersistedFormValues(): Promise<void> {
  await storage.removeItem('session:persistedFormValues');
}

/**
 * Upload a new version of the vault to the server using the provided sqlite client.
 */
async function uploadNewVaultToServer(sqliteClient: SqliteClient) : Promise<VaultPostResponse> {
  const updatedVaultData = sqliteClient.exportToBase64();
  const derivedKey = await storage.getItem('session:derivedKey') as string;

  const encryptedVault = await EncryptionUtility.symmetricEncrypt(
    updatedVaultData,
    derivedKey
  );

  await storage.setItems([
    { key: 'session:encryptedVault', value: encryptedVault }
  ]);

  // Get metadata from storage
  const vaultRevisionNumber = await storage.getItem('session:vaultRevisionNumber') as number;

  // Upload new encrypted vault to server.
  const username = await storage.getItem('local:username') as string;
  const emailAddresses = await getEmailAddressesForVault(sqliteClient);

  const newVault: Vault = {
    blob: encryptedVault,
    createdAt: new Date().toISOString(),
    credentialsCount: sqliteClient.getAllCredentials().length,
    currentRevisionNumber: vaultRevisionNumber,
    emailAddressList: emailAddresses,
    privateEmailDomainList: [], // Empty on purpose, API will not use this for vault updates.
    publicEmailDomainList: [], // Empty on purpose, API will not use this for vault updates.
    encryptionPublicKey: '', // Empty on purpose, only required if new public/private key pair is generated.
    client: '', // Empty on purpose, API will not use this for vault updates.
    updatedAt: new Date().toISOString(),
    username: username,
    version: sqliteClient.getDatabaseVersion().version
  };

  const webApi = new WebApiService(() => {});
  const response = await webApi.post<Vault, VaultPostResponse>('Vault', newVault);

  // Check if response is successful (.status === 0)
  if (response.status === 0) {
    await storage.setItem('session:vaultRevisionNumber', response.newRevisionNumber);
  } else {
    throw new Error(await t('common.errors.failedToUploadVaultToServer'));
  }

  return response;
}

/**
 * Create a new sqlite client for the stored vault.
 */
async function createVaultSqliteClient() : Promise<SqliteClient> {
  const encryptedVault = await storage.getItem('session:encryptedVault') as string;
  const derivedKey = await storage.getItem('session:derivedKey') as string;
  if (!encryptedVault || !derivedKey) {
    throw new Error(await t('common.errors.unknownError'));
  }

  // Decrypt the vault.
  const decryptedVault = await EncryptionUtility.symmetricDecrypt(
    encryptedVault,
    derivedKey
  );

  // Initialize the SQLite client with the decrypted vault.
  const sqliteClient = new SqliteClient();
  await sqliteClient.initializeFromBase64(decryptedVault);

  return sqliteClient;
}
