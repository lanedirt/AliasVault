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
    vaultState.publicEmailDomains = vaultResponse.vault.publicEmailDomainList || [];
    vaultState.privateEmailDomains = vaultResponse.vault.privateEmailDomainList || [];
    vaultState.vaultRevisionNumber = vaultResponse.vault.currentRevisionNumber || 0;

    // Store encrypted vault in chrome.storage.session
    await chrome.storage.session.set({
      encryptedVault: encryptedVaultBlob,
      publicEmailDomains: vaultState.publicEmailDomains,
      privateEmailDomains: vaultState.privateEmailDomains,
      vaultRevisionNumber: vaultState.vaultRevisionNumber
    });

    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to store vault:', error);
    sendResponse({ success: false, error: 'Failed to store vault' });
  }
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
      publicEmailDomains: result.publicEmailDomains || [],
      privateEmailDomains: result.privateEmailDomains || [],
      vaultRevisionNumber: result.vaultRevisionNumber || 0
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
  vaultState.publicEmailDomains = [];
  vaultState.privateEmailDomains = [];
  vaultState.vaultRevisionNumber = 0;
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
    const result = await chrome.storage.session.get(['encryptedVault']);

    if (!result.encryptedVault) {
      sendResponse({ credentials: [], status: 'LOCKED' });
      return;
    }

    const decryptedVault = await EncryptionUtility.symmetricDecrypt(
      result.encryptedVault,
      vaultState.derivedKey
    );

    const sqliteClient = new SqliteClient();
    await sqliteClient.initializeFromBase64(decryptedVault);
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
    // Get the encrypted vault from chrome.storage.session.
    const result = await chrome.storage.session.get(['encryptedVault']);

    if (!result.encryptedVault) {
      sendResponse({ success: false, error: 'No vault found' });
      return;
    }

    // Decrypt the vault.
    const decryptedVault = await EncryptionUtility.symmetricDecrypt(
      result.encryptedVault,
      vaultState.derivedKey
    );

    // Initialize the SQLite client with the decrypted vault.
    const sqliteClient = new SqliteClient();
    await sqliteClient.initializeFromBase64(decryptedVault);

    // Add the new credential to the vault/database.
    await sqliteClient.createCredential(message.credential);

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
export function getEmailAddressesForVault(
  sqliteClient: SqliteClient,
  vaultState: VaultState
): string[] {
  // TODO: create separate query to only get email addresses to avoid loading all credentials.
  const credentials = sqliteClient.getAllCredentials();

  const emailAddresses = credentials
    .filter(cred => cred.Email != null)
    .map(cred => cred.Email!)
    .filter((email, index, self) => self.indexOf(email) === index);

  return emailAddresses.filter(email => {
    const domain = email.split('@')[1];
    return vaultState.privateEmailDomains.includes(domain);
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

  /*
   * TODO: usage between chrome storage session and vaultState is
   * now mixed. Determine where to store the domain lists and avoid
   * storing it in multiple places when it's not needed.
   */
  chrome.storage.session.get(['publicEmailDomains', 'privateEmailDomains'], (result) => {
    const privateEmailDomains = result.privateEmailDomains || [];
    const publicEmailDomains = result.publicEmailDomains || [];

    /*
     * TODO: add vault preference settings to determine which domain to use
     * taking into account vault settings.
     */

    /**
     * Check if a domain is valid.
     */
    const isValidDomain = (domain: string) : boolean => {
      return domain &&
                 domain !== 'DISABLED.TLD' &&
                 (privateEmailDomains.includes(domain) || publicEmailDomains.includes(domain));
    };

    // Get first valid private domain
    const firstPrivate = privateEmailDomains.find(isValidDomain);

    if (firstPrivate) {
      sendResponse({ domain: firstPrivate });
      return;
    }

    // Return first valid public domain
    const firstPublic = publicEmailDomains.find(isValidDomain);

    if (firstPublic) {
      sendResponse({ domain: firstPublic });
      return;
    }

    // Return null if no valid domains are found
    sendResponse({ domain: null });

    return;
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
    encryptedVault,
    publicEmailDomains: vaultState.publicEmailDomains,
    privateEmailDomains: vaultState.privateEmailDomains
  });

  // Upload new encrypted vault to server.
  const username = await chrome.storage.local.get('username');
  const emailAddresses = await getEmailAddressesForVault(sqliteClient, vaultState);

  const newVault: Vault = {
    blob: encryptedVault,
    createdAt: new Date().toISOString(),
    credentialsCount: 0, // TODO
    currentRevisionNumber: vaultState.vaultRevisionNumber,
    emailAddressList: emailAddresses,
    privateEmailDomainList: [], // TODO
    publicEmailDomainList: [], // TODO
    encryptionPublicKey: '', // TODO
    updatedAt: new Date().toISOString(),
    username: username.username,
    version: '1.0.0'
  };

  const webApi = new WebApiService(() => {});
  await webApi.initializeBaseUrl();
  await webApi.post('Vault', newVault);
}