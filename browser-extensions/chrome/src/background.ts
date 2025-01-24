import { Buffer } from 'buffer';
import EncryptionUtility from './utilities/EncryptionUtility';

console.log('Background script initialized');

let vaultState: {
  decryptedVault: any | null;
  sessionKey: string | null;
} = {
  decryptedVault: null,
  sessionKey: null
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message.type);
  switch (message.type) {
    case 'STORE_VAULT':
      // Generate random session key
      const sessionKey = crypto.getRandomValues(new Uint8Array(32));
      vaultState.sessionKey = Buffer.from(sessionKey).toString('base64');

      console.log('Session key for encryption:', vaultState.sessionKey);
      console.log('Vault data being encrypted:', message.vault);

      // Re-encrypt vault with session key
      (async () => {
        try {
          const encryptedVault = await EncryptionUtility.symmetricEncrypt(
            JSON.stringify(message.vault),
            vaultState.sessionKey
          );

          console.log('Encrypted vault (after encryption):', encryptedVault);

          // Store in chrome.storage.session and wait for completion
          chrome.storage.session.set({ encryptedVault }, () => {
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

    case 'GET_VAULT':
      if (!vaultState.sessionKey) {
        console.log('No session key available');
        sendResponse({ vault: null });
        return;
      }

      chrome.storage.session.get(['encryptedVault'], async (result) => {
        try {
          if (!result.encryptedVault) {
            console.log('No encrypted vault found in storage');
            sendResponse({ vault: null });
            return;
          }

          // Decrypt vault with session key
          const decryptedVault = await EncryptionUtility.symmetricDecrypt(
            result.encryptedVault,
            vaultState.sessionKey!
          );

          // Parse the decrypted vault and send response
          try {
            const parsedVault = JSON.parse(decryptedVault);
            sendResponse({ vault: parsedVault });
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

    case 'CLEAR_VAULT':
      vaultState.sessionKey = null;
      chrome.storage.session.remove(['encryptedVault']);
      sendResponse({ success: true });
      break;
  }
  return true;
});