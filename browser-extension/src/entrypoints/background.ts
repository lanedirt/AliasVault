import { browser } from "wxt/browser";
import { setupContextMenus, handleContextMenuClick } from './background/ContextMenu';
import { handleClearVault, handleCreateIdentity, handleGetCredentials, handleGetDefaultEmailDomain, handleGetDerivedKey, handleGetVault, handleStoreVault, handleSyncVault } from './background/VaultMessageHandler';
import { handleOpenPopup, handlePopupWithCredential } from './background/PopupMessageHandler';

export default defineBackground({
  main() {
    // Set up context menus
    setupContextMenus();
    browser.contextMenus.onClicked.addListener(handleContextMenuClick as any);

    // Listen for messages from popup
    browser.runtime.onMessage.addListener((message: any, sender: any) => {
      switch (message.type) {
        // Vault-related messages
        case 'STORE_VAULT':
          return handleStoreVault(message, sender);

        case 'SYNC_VAULT':
          return handleSyncVault(sender);

        case 'GET_VAULT':
          return handleGetVault(sender);

        case 'CLEAR_VAULT':
          return handleClearVault(sender);

        case 'GET_CREDENTIALS':
          return handleGetCredentials(sender);

        case 'CREATE_IDENTITY':
          return handleCreateIdentity(message, sender);

        case 'GET_DEFAULT_EMAIL_DOMAIN':
          return handleGetDefaultEmailDomain(sender);

        case 'GET_DERIVED_KEY':
          return handleGetDerivedKey(sender);

        // Popup-related messages
        case 'OPEN_POPUP':
          return handleOpenPopup(message, sender);

        case 'OPEN_POPUP_WITH_CREDENTIAL':
          return handlePopupWithCredential(message, sender);

        default:
          console.error(`Unknown message type: ${message.type}`);
          return;
      }
    });
  }
});