/* eslint-disable @typescript-eslint/no-explicit-any */
import { VaultState } from './VaultState';
import EncryptionUtility from '../shared/EncryptionUtility';
import SqliteClient from '../shared/SqliteClient';
import { WebApiService } from '../shared/WebApiService';
import { Vault } from '../shared/types/webapi/Vault';
import { Credential } from '../shared/types/Credential';
import { VaultResponse } from '../shared/types/webapi/VaultResponse';

/**
 * Store the vault in browser storage.
 */
export async function handleStoreVault(
  message: any,
  vaultState: VaultState,
  sendResponse: (response: any) => void
) : Promise<void> {
  try {
    const vaultResponse = message.vaultResponse as VaultResponse;
    const encryptedVaultBlob = vaultResponse.vault.blob;

    // Store derived key in local memory
    vaultState.derivedKey = message.derivedKey;

    // Store encrypted vault in chrome.storage.session
    await chrome.storage.session.set({
      encryptedVault: encryptedVaultBlob,
      publicEmailDomains: vaultResponse.vault.publicEmailDomainList,
      privateEmailDomains: vaultResponse.vault.privateEmailDomainList,
      vaultRevisionNumber: vaultResponse.vault.currentRevisionNumber
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to store vault:', error);
    sendResponse({ success: false, error: 'Failed to store vault' });
  }
}

/**
 * Sync the vault with the server to check if a newer vault is available. If so, the vault will be updated.
 */
export async function handleSyncVault(
  vaultState: VaultState,
  sendResponse: (response: any) => void
) : Promise<void> {
  const webApi = new WebApiService(() => {});
  const response = await webApi.getStatus();

  if (!response.supported) {
    sendResponse({ success: false, error: 'The browser extension is outdated. Please update to the latest version.' });
    return;
  }

  const result = await chrome.storage.session.get([
    'vaultRevisionNumber'
  ]);

  if (response.vaultRevision > result.vaultRevisionNumber) {
    // Retrieve the latest vault from the server.
    const vaultResponse = await webApi.get<VaultResponse>('Vault');

    // Store encrypted vault in chrome.storage.session
    await chrome.storage.session.set({
      encryptedVault: vaultResponse.vault.blob,
      publicEmailDomains: vaultResponse.vault.publicEmailDomainList,
      privateEmailDomains: vaultResponse.vault.privateEmailDomainList,
      vaultRevisionNumber: vaultResponse.vault.currentRevisionNumber
    });
  }

  sendResponse({ success: true });
}

/**
 * Get the vault from browser storage.
 */
export async function handleGetVault(
  vaultState: VaultState,
  sendResponse: (response: any) => void
) : Promise<void> {
  if (!vaultState.derivedKey) {
    sendResponse({ vault: null });
    return;
  }

  try {
    const result = await chrome.storage.session.get([
      'encryptedVault',
      'publicEmailDomains',
      'privateEmailDomains',
      'vaultRevisionNumber'
    ]);

    if (!result.encryptedVault) {
      console.error('No encrypted vault found in storage');
      sendResponse({ vault: null });
      return;
    }

    const decryptedVault = await EncryptionUtility.symmetricDecrypt(
      result.encryptedVault,
      vaultState.derivedKey
    );

    sendResponse({
      vault: decryptedVault,
      publicEmailDomains: result.publicEmailDomains ?? [],
      privateEmailDomains: result.privateEmailDomains ?? [],
      vaultRevisionNumber: result.vaultRevisionNumber ?? 0
    });
  } catch (error) {
    console.error('Failed to get vault:', error);
    sendResponse({ vault: null, error: 'Failed to get vault' });
  }
}

/**
 * Clear the vault from browser storage.
 */
export function handleClearVault(
  vaultState: VaultState,
  sendResponse: (response: any) => void
) : void {
  vaultState.derivedKey = null;
  chrome.storage.session.remove([
    'encryptedVault',
    'publicEmailDomains',
    'privateEmailDomains',
    'vaultRevisionNumber'
  ]);
  sendResponse({ success: true });
}

/**
 * Get all credentials.
 */
export async function handleGetCredentials(
  vaultState: VaultState,
  sendResponse: (response: any) => void
) : Promise<void> {
  if (!vaultState.derivedKey) {
    sendResponse({ credentials: [], status: 'LOCKED' });
    return;
  }

  try {
    const sqliteClient = await createVaultSqliteClient(vaultState);
    const credentials = sqliteClient.getAllCredentials();
    sendResponse({ credentials: credentials, status: 'OK' });
  } catch (error) {
    console.error('Error getting credentials:', error);
    sendResponse({ credentials: [], status: 'LOCKED', error: 'Failed to get credentials' });
  }
}

/**
 * Create an identity.
 */
export async function handleCreateIdentity(
  message: { credential: Credential },
  vaultState: VaultState,
  sendResponse: (response: any) => void
) : Promise<void> {
  if (!vaultState.derivedKey) {
    sendResponse({ success: false, error: 'Vault is locked' });
    return;
  }

  try {
    const sqliteClient = await createVaultSqliteClient(vaultState);

    // Add the new credential to the vault/database.
    sqliteClient.createCredential(message.credential);

    // Upload the new vault to the server.
    await uploadNewVaultToServer(sqliteClient, vaultState);

    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to create identity:', error);
    sendResponse({ success: false, error: 'Failed to create identity' });
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
  const storageResult = await chrome.storage.session.get(['privateEmailDomains']);

  const emailAddresses = credentials
    .filter(cred => cred.Email != null)
    .map(cred => cred.Email!)
    .filter((email, index, self) => self.indexOf(email) === index);

  return emailAddresses.filter(email => {
    const domain = email.split('@')[1];
    return storageResult.privateEmailDomains.includes(domain);
  });
}

/**
 * Get default email domain for a vault.
 */
export function handleGetDefaultEmailDomain(
  vaultState: VaultState,
  sendResponse: (response: any) => void
) : void {
  if (!vaultState.derivedKey) {
    sendResponse({ domain: null });
    return;
  }

  chrome.storage.session.get(['publicEmailDomains', 'privateEmailDomains'], async (result) => {
    const privateEmailDomains = result.privateEmailDomains ?? [];
    const publicEmailDomains = result.publicEmailDomains ?? [];

    const sqliteClient = await createVaultSqliteClient(vaultState);
    const defaultEmailDomain = sqliteClient.getDefaultEmailDomain();

    /**
     * Check if a domain is valid.
     */
    const isValidDomain = (domain: string) : boolean => {
      return domain &&
                 domain !== 'DISABLED.TLD' &&
                 (privateEmailDomains.includes(domain) || publicEmailDomains.includes(domain));
    };

    // First check if the default domain that is configured in the vault is still valid.
    if (defaultEmailDomain && isValidDomain(defaultEmailDomain)) {
      sendResponse({ domain: defaultEmailDomain });
      return;
    }

    // If default domain is not valid, fall back to first available private domain.
    const firstPrivate = privateEmailDomains.find(isValidDomain);

    if (firstPrivate) {
      sendResponse({ domain: firstPrivate });
      return;
    }

    // Return first valid public domain if no private domains are available.
    const firstPublic = publicEmailDomains.find(isValidDomain);

    if (firstPublic) {
      sendResponse({ domain: firstPublic });
      return;
    }

    // Return null if no valid domains are found
    sendResponse({ domain: null });
  });
}

/**
 * Get the derived key for a vault which is stored in local memory only.
 */
export function handleGetDerivedKey(
  vaultState: VaultState,
  sendResponse: (response: any) => void
) : void {
  sendResponse(vaultState.derivedKey ? vaultState.derivedKey : null);
}

/**
 * Upload a new version of the vault to the server using the provided sqlite client.
 */
async function uploadNewVaultToServer(sqliteClient: SqliteClient, vaultState: VaultState) : Promise<void> {
  const updatedVaultData = sqliteClient.exportToBase64();
  const encryptedVault = await EncryptionUtility.symmetricEncrypt(
    updatedVaultData,
    vaultState.derivedKey!
  );

  // Store updated encrypted vault in chrome.storage.session.
  await chrome.storage.session.set({
    encryptedVault
  });

  // Get metadata from storage
  const storageResult = await chrome.storage.session.get(['vaultRevisionNumber']);

  // Upload new encrypted vault to server.
  const username = await chrome.storage.local.get('username');
  const emailAddresses = await getEmailAddressesForVault(sqliteClient);

  const newVault: Vault = {
    blob: encryptedVault,
    createdAt: new Date().toISOString(),
    credentialsCount: sqliteClient.getAllCredentials().length,
    currentRevisionNumber: storageResult.vaultRevisionNumber,
    emailAddressList: emailAddresses,
    privateEmailDomainList: [], // Empty on purpose, API will not use this for vault updates.
    publicEmailDomainList: [], // Empty on purpose, API will not use this for vault updates.
    encryptionPublicKey: '', // Empty on purpose, only required if new public/private key pair is generated.
    updatedAt: new Date().toISOString(),
    username: username.username,
    version: sqliteClient.getDatabaseVersion() ?? '0.0.0'
  };

  const webApi = new WebApiService(() => {});
  const response = await webApi.post('Vault', newVault) as { status: number, newRevisionNumber: number };

  // Check if response is successful (.status === 0)
  if (response.status === 0) {
    // Update the vault revision number in chrome.storage.session.
    await chrome.storage.session.set({
      vaultRevisionNumber: response.newRevisionNumber
    });
  }
  else {
    throw new Error('Failed to upload new vault to server');
  }
}

/**
 * Create a new sqlite client for the stored vault.
 */
async function createVaultSqliteClient(vaultState: VaultState) : Promise<SqliteClient> {
  // Get the encrypted vault from chrome.storage.session.
  const result = await chrome.storage.session.get(['encryptedVault']);

  if (!result.encryptedVault) {
    throw new Error('No vault found');
  }

  // Decrypt the vault.
  const decryptedVault = await EncryptionUtility.symmetricDecrypt(
    result.encryptedVault,
      vaultState.derivedKey!
  );

  // Initialize the SQLite client with the decrypted vault.
  const sqliteClient = new SqliteClient();
  await sqliteClient.initializeFromBase64(decryptedVault);

  return sqliteClient;
}
