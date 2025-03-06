import { browser } from "wxt/browser";
import { onMessage } from "webext-bridge/background";
import { setupContextMenus, handleContextMenuClick } from './background/ContextMenu';
import { handleClearVault, handleCreateIdentity, handleGetCredentials, handleGetDefaultEmailDomain, handleGetDerivedKey, handleGetVault, handleStoreVault, handleSyncVault } from './background/VaultMessageHandler';
import { handleOpenPopup, handlePopupWithCredential } from './background/PopupMessageHandler';

export default defineBackground({
  main() {
    // Set up context menus
    setupContextMenus();
    browser.contextMenus.onClicked.addListener(handleContextMenuClick as any);

    // Listen for messages using webext-bridge
    onMessage('STORE_VAULT', ({ data }) => handleStoreVault(data));
    onMessage('SYNC_VAULT', () => handleSyncVault());
    onMessage('GET_VAULT', () => handleGetVault());
    onMessage('CLEAR_VAULT', () => handleClearVault());
    onMessage('GET_CREDENTIALS', () => handleGetCredentials());
    onMessage('CREATE_IDENTITY', ({ data }) => handleCreateIdentity(data));
    onMessage('GET_DEFAULT_EMAIL_DOMAIN', () => handleGetDefaultEmailDomain());
    onMessage('GET_DERIVED_KEY', () => handleGetDerivedKey());
    onMessage('OPEN_POPUP', () => handleOpenPopup());
    onMessage('OPEN_POPUP_WITH_CREDENTIAL', ({ data }) => handlePopupWithCredential(data));
  }
});