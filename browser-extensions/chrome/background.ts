import { setupContextMenus, handleContextMenuClick } from './src/background/ContextMenu';
import { handleClearVault, handleCreateIdentity, handleGetCredentials, handleGetDefaultEmailDomain, handleGetDerivedKey, handleGetVault, handleStoreVault, handleSyncVault } from './src/background/VaultMessageHandler';
import { handleOpenPopup, handlePopupWithCredential } from './src/background/PopupMessageHandler';

// Set up context menus
chrome.runtime.onInstalled.addListener(setupContextMenus);
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    // Vault-related messages
    case 'STORE_VAULT':
      handleStoreVault(message, sendResponse);
      break;

    case 'SYNC_VAULT':
      handleSyncVault(sendResponse);
      break;

    case 'GET_VAULT':
      handleGetVault(sendResponse);
      break;

    case 'CLEAR_VAULT':
      handleClearVault(sendResponse);
      break;

    case 'GET_CREDENTIALS':
      handleGetCredentials(sendResponse);
      break;

    case 'CREATE_IDENTITY':
      handleCreateIdentity(message, sendResponse);
      break;

    case 'GET_DEFAULT_EMAIL_DOMAIN':
      handleGetDefaultEmailDomain(sendResponse);
      break;

    case 'GET_DERIVED_KEY':
      handleGetDerivedKey(sendResponse);
      break;

    // Popup-related messages
    case 'OPEN_POPUP': {
      handleOpenPopup(message, sendResponse);
      break;
    }

    case 'OPEN_POPUP_WITH_CREDENTIAL': {
      handlePopupWithCredential(message, sendResponse);
      break;
    }

    default:
      console.error(`Unknown message type: ${message.type}`);
      break;
  }

  return true;
});