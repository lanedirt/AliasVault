/* eslint-disable @typescript-eslint/no-explicit-any */
import { VaultState } from './VaultState';
import EncryptionUtility from '../utils/EncryptionUtility';
import SqliteClient from '../utils/SqliteClient';
import { WebApiService } from '../utils/WebApiService';
import { Vault } from '../types/webapi/Vault';
import { Credential } from '../types/Credential';

/**
 * Store the vault in browser storage.
 */
export async function handleStoreVault(
  message: any,
  vaultState: VaultState,
  sendResponse: (response: any) => void
) : Promise<void> {
  try {
    // Store state
    vaultState.derivedKey = message.derivedKey;
    vaultState.publicEmailDomains = message.publicEmailDomains || [];
    vaultState.privateEmailDomains = message.privateEmailDomains || [];
    vaultState.vaultRevisionNumber = message.vaultRevisionNumber || 0;

    // Encrypt vault
    const encryptedVault = await EncryptionUtility.symmetricEncrypt(
      message.vault,
      vaultState.derivedKey!
    );

    // Store in chrome.storage.session
    await chrome.storage.session.set({
      encryptedVault,
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
 * Get the credentials for a URL.
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
    const result = await chrome.storage.session.get(['encryptedVault']);

    if (!result.encryptedVault) {
      sendResponse({ success: false, error: 'No vault found' });
      return;
    }

    const decryptedVault = await EncryptionUtility.symmetricDecrypt(
      result.encryptedVault,
      vaultState.derivedKey
    );

    const sqliteClient = new SqliteClient();
    await sqliteClient.initializeFromBase64(decryptedVault);
    await sqliteClient.createCredential(message.credential);

    const updatedVaultData = sqliteClient.exportToBase64();
    const encryptedVault = await EncryptionUtility.symmetricEncrypt(
      updatedVaultData,
      vaultState.derivedKey
    );

    await chrome.storage.session.set({
      encryptedVault,
      publicEmailDomains: vaultState.publicEmailDomains,
      privateEmailDomains: vaultState.privateEmailDomains
    });

    // Upload new vault to server
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
    /*
     *  TODO: re-enable
     * await webApi.post('Vault', newVault);
     */

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