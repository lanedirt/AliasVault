import EncryptionUtility from './utils/EncryptionUtility';
import SqliteClient from './utils/SqliteClient';

let vaultState: {
  derivedKey: string | null;
  publicEmailDomains: string[];
  privateEmailDomains: string[];
} = {
  derivedKey: null,
  publicEmailDomains: [],
  privateEmailDomains: []
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'STORE_VAULT': {
      // Store derived key and domain lists in memory for future vault syncs
      vaultState.derivedKey = message.derivedKey;
      vaultState.publicEmailDomains = message.publicEmailDomains || [];
      vaultState.privateEmailDomains = message.privateEmailDomains || [];

      // Re-encrypt vault with session key
      (async () : Promise<void> => {
        try {
          const encryptedVault = await EncryptionUtility.symmetricEncrypt(
            message.vault,
            vaultState.derivedKey!
          );

          // Store in chrome.storage.session and wait for completion
          chrome.storage.session.set({
            encryptedVault,
            publicEmailDomains: vaultState.publicEmailDomains,
            privateEmailDomains: vaultState.privateEmailDomains
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Failed to store vault:', chrome.runtime.lastError);
              sendResponse({ success: false, error: 'Failed to store vault' });
            } else {
              sendResponse({ success: true });
            }
          });
        } catch (error) {
          console.error('Encryption failed:', error);
          sendResponse({ success: false, error: 'Encryption failed' });
        }
      })();
      break;
    }
    case 'GET_VAULT': {
      if (!vaultState.derivedKey) {
        sendResponse({ vault: null });
        return;
      }

      chrome.storage.session.get(['encryptedVault', 'publicEmailDomains', 'privateEmailDomains'], async (result) => {
        try {
          if (!result.encryptedVault) {
            console.error('No encrypted vault found in storage');
            sendResponse({ vault: null });
            return;
          }

          // Decrypt vault with derived key
          const decryptedVault = await EncryptionUtility.symmetricDecrypt(
            result.encryptedVault,
            vaultState.derivedKey!
          );

          // Parse the decrypted vault and send response with domain lists
          try {
            sendResponse({
              vault: decryptedVault,
              publicEmailDomains: result.publicEmailDomains || [],
              privateEmailDomains: result.privateEmailDomains || []
            });
          } catch (parseError) {
            console.error('Failed to parse decrypted vault:', parseError);
            sendResponse({ vault: null, error: 'Failed to parse decrypted vault' });
          }
        } catch (decryptError) {
          console.error('Failed to decrypt vault:', decryptError);
          sendResponse({ vault: null, error: 'Failed to decrypt vault' });
        }
      });
      break;
    }
    case 'CLEAR_VAULT': {
      vaultState.derivedKey = null;
      vaultState.publicEmailDomains = [];
      vaultState.privateEmailDomains = [];
      chrome.storage.session.remove(['encryptedVault', 'publicEmailDomains', 'privateEmailDomains']);
      sendResponse({ success: true });
      break;
    }

    case 'GET_CREDENTIALS_FOR_URL': {
      if (!vaultState.derivedKey) {
        sendResponse({ credentials: [], status: 'LOCKED' });
        return;
      }

      chrome.storage.session.get(['encryptedVault'], async (result) => {
        try {
          if (!result.encryptedVault) {
            sendResponse({ credentials: [], status: 'LOCKED' });
            return;
          }

          const decryptedVault = await EncryptionUtility.symmetricDecrypt(
            result.encryptedVault,
            vaultState.derivedKey!
          );

          // Initialize SQLite client and get credentials.
          const sqliteClient = new SqliteClient();
          await sqliteClient.initializeFromBase64(decryptedVault);

          // Return all credentials, filtering will happpen in contentScript.
          const credentials = sqliteClient.getAllCredentials();

          sendResponse({ credentials: credentials, status: 'OK' });
        } catch (error) {
          console.error('Error getting credentials:', error);
          sendResponse({ credentials: [], status: 'LOCKED', error: 'Failed to get credentials' });
        }
      });
      break;
    }

    case 'GET_DERIVED_KEY': {
      sendResponse(vaultState.derivedKey ? vaultState.derivedKey : null);
      break;
    }

    case 'OPEN_POPUP': {
      chrome.windows.create({
        url: chrome.runtime.getURL('index.html?mode=inline_unlock'),
        type: 'popup',
        width: 400,
        height: 600,
        focused: true
      });
      sendResponse({ success: true });
      break;
    }

    case 'GET_DEFAULT_EMAIL_DOMAIN': {
      if (!vaultState.derivedKey) {
        sendResponse({ domain: null });
        return;
      }

      // TODO: usage between chrome storage session and vaultState is
      // now mixed. Determine where to store the domain lists and avoid
      // storing it in multiple places when it's not needed.
      chrome.storage.session.get(['publicEmailDomains', 'privateEmailDomains'], (result) => {
        const privateEmailDomains = result.privateEmailDomains || [];
        const publicEmailDomains = result.publicEmailDomains || [];

        // TODO: add vault preference settings to determine which domain to use
        // taking into account vault settings.

        // Function to check if a domain is valid
        const isValidDomain = (domain: string) => {
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
      });
      break;
    }

    case 'CREATE_IDENTITY': {
      if (!vaultState.derivedKey) {
        sendResponse({ success: false, error: 'Vault is locked' });
        return;
      }

      chrome.storage.session.get(['encryptedVault'], async (result) => {
        try {
          if (!result.encryptedVault) {
            sendResponse({ success: false, error: 'No vault found' });
            return;
          }

          const decryptedVault = await EncryptionUtility.symmetricDecrypt(
            result.encryptedVault,
            vaultState.derivedKey!
          );

          // Initialize SQLite client
          const sqliteClient = new SqliteClient();
          await sqliteClient.initializeFromBase64(decryptedVault);

          // Create new credential with random identity
          const credential = message.credential as import('./types/Credential').Credential;
          await sqliteClient.createCredential(credential);

          // Instead of sending a message, directly encrypt and store the updated vault
          const updatedVaultData = sqliteClient.exportToBase64();
          const encryptedVault = await EncryptionUtility.symmetricEncrypt(
            updatedVaultData,
            vaultState.derivedKey!
          );

          // Store in chrome.storage.session
          await chrome.storage.session.set({
            encryptedVault,
            publicEmailDomains: vaultState.publicEmailDomains,
            privateEmailDomains: vaultState.privateEmailDomains
          });

          sendResponse({ success: true });
        } catch (error) {
          console.error('Failed to create identity:', error);
          sendResponse({ success: false, error: 'Failed to create identity' });
        }
      });
      break;
    }
  }
  return true;
});
