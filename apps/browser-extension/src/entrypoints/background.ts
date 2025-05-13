import { defineBackground } from '#imports';
import { onMessage } from "webext-bridge/background";
import { setupContextMenus } from '@/entrypoints/background/ContextMenu';
import { handleCheckAuthStatus, handleClearVault, handleCreateIdentity, handleGetCredentials, handleGetDefaultEmailDomain, handleGetDefaultIdentityLanguage, handleGetDerivedKey, handleGetPasswordSettings, handleGetVault, handleStoreVault, handleSyncVault } from '@/entrypoints/background/VaultMessageHandler';
import { handleOpenPopup, handlePopupWithCredential, handleToggleContextMenu } from '@/entrypoints/background/PopupMessageHandler';
import { storage } from '#imports';
import { GLOBAL_CONTEXT_MENU_ENABLED_KEY } from '@/utils/Constants';
export default defineBackground({
  /**
   * This is the main entry point for the background script.
   */
  async main() {
    // Listen for messages using webext-bridge
    onMessage('CHECK_AUTH_STATUS', () => handleCheckAuthStatus());
    onMessage('STORE_VAULT', ({ data }) => handleStoreVault(data));
    onMessage('SYNC_VAULT', () => handleSyncVault());
    onMessage('GET_VAULT', () => handleGetVault());
    onMessage('CLEAR_VAULT', () => handleClearVault());
    onMessage('GET_CREDENTIALS', () => handleGetCredentials());
    onMessage('CREATE_IDENTITY', ({ data }) => handleCreateIdentity(data));
    onMessage('GET_DEFAULT_EMAIL_DOMAIN', () => handleGetDefaultEmailDomain());
    onMessage('GET_DEFAULT_IDENTITY_LANGUAGE', () => handleGetDefaultIdentityLanguage());
    onMessage('GET_PASSWORD_SETTINGS', () => handleGetPasswordSettings());
    onMessage('GET_DERIVED_KEY', () => handleGetDerivedKey());
    onMessage('OPEN_POPUP', () => handleOpenPopup());
    onMessage('OPEN_POPUP_WITH_CREDENTIAL', ({ data }) => handlePopupWithCredential(data));
    onMessage('TOGGLE_CONTEXT_MENU', ({ data }) => handleToggleContextMenu(data));

    // Setup context menus
    const isContextMenuEnabled = await storage.getItem(GLOBAL_CONTEXT_MENU_ENABLED_KEY) ?? true;
    if (isContextMenuEnabled) {
      setupContextMenus();
    }
  }
});