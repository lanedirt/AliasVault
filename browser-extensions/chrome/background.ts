import { VaultState, initialVaultState } from './src/background/VaultState';
import { setupContextMenus, handleContextMenuClick } from './src/background/ContextMenu';
import { handleClearVault, handleCreateIdentity, handleGetCredentials, handleGetDefaultEmailDomain, handleGetDerivedKey, handleGetVault, handleStoreVault } from './src/background/VaultMessageHandler';
import { handleOpenPopup, handlePopupWithCredential } from './src/background/PopupMessageHandler';

let vaultState: VaultState = { ...initialVaultState };

// Set up context menus
chrome.runtime.onInstalled.addListener(setupContextMenus);
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    // Vault-related messages
    case 'STORE_VAULT':
      handleStoreVault(message, vaultState, sendResponse);
      break;

    case 'GET_VAULT':
      handleGetVault(vaultState, sendResponse);
      break;

    case 'CLEAR_VAULT':
      handleClearVault(vaultState, sendResponse);
      break;

    case 'GET_CREDENTIALS_FOR_URL':
      handleGetCredentials(vaultState, sendResponse);
      break;

    case 'CREATE_IDENTITY':
      handleCreateIdentity(message, vaultState, sendResponse);
      break;

    case 'GET_DEFAULT_EMAIL_DOMAIN':
      handleGetDefaultEmailDomain(vaultState, sendResponse);
      break;

    case 'GET_DERIVED_KEY':
      handleGetDerivedKey(vaultState, sendResponse);
      break;

    // Popup-related messages
    case 'OPEN_POPUP': {
      handleOpenPopup(message, vaultState, sendResponse);
      break;
    }

    case 'OPEN_POPUP_WITH_CREDENTIAL': {
      handlePopupWithCredential(message, vaultState, sendResponse);
      break;
    }

    default:
      console.error(`Unknown message type: ${message.type}`);
      break;
  }

  return true;
});