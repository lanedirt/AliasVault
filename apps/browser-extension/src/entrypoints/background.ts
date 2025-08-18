import { onMessage, sendMessage } from "webext-bridge/background";

import { setupContextMenus } from '@/entrypoints/background/ContextMenu';
import { handleOpenPopup, handlePopupWithCredential, handleToggleContextMenu } from '@/entrypoints/background/PopupMessageHandler';
import { handleCheckAuthStatus, handleClearPersistedFormValues, handleClearVault, handleCreateIdentity, handleGetCredentials, handleGetDefaultEmailDomain, handleGetDefaultIdentitySettings, handleGetEncryptionKey, handleGetEncryptionKeyDerivationParams, handleGetPasswordSettings, handleGetPersistedFormValues, handleGetVault, handlePersistFormValues, handleStoreEncryptionKey, handleStoreEncryptionKeyDerivationParams, handleStoreVault, handleSyncVault, handleUploadVault } from '@/entrypoints/background/VaultMessageHandler';

import { GLOBAL_CONTEXT_MENU_ENABLED_KEY, CLIPBOARD_CLEAR_TIMEOUT_KEY } from '@/utils/Constants';
import type { EncryptionKeyDerivationParams } from '@/utils/dist/shared/models/metadata';

import { defineBackground, storage, browser } from '#imports';

let clipboardClearTimer: NodeJS.Timeout | null = null;
let countdownInterval: NodeJS.Timeout | null = null;
let remainingTime = 0;
let currentCountdownId = 0;
let totalCountdownTime = 0;
let countdownStartTime = 0;
let offscreenDocumentCreated = false;

export default defineBackground({
  /**
   * This is the main entry point for the background script.
   */
  async main() {
    // Listen for messages using webext-bridge
    onMessage('CHECK_AUTH_STATUS', () => handleCheckAuthStatus());

    onMessage('GET_ENCRYPTION_KEY', () => handleGetEncryptionKey());
    onMessage('GET_ENCRYPTION_KEY_DERIVATION_PARAMS', () => handleGetEncryptionKeyDerivationParams());
    onMessage('GET_VAULT', () => handleGetVault());
    onMessage('GET_CREDENTIALS', () => handleGetCredentials());

    onMessage('GET_DEFAULT_EMAIL_DOMAIN', () => handleGetDefaultEmailDomain());
    onMessage('GET_DEFAULT_IDENTITY_SETTINGS', () => handleGetDefaultIdentitySettings());
    onMessage('GET_PASSWORD_SETTINGS', () => handleGetPasswordSettings());

    onMessage('STORE_VAULT', ({ data }) => handleStoreVault(data));
    onMessage('STORE_ENCRYPTION_KEY', ({ data }) => handleStoreEncryptionKey(data as string));
    onMessage('STORE_ENCRYPTION_KEY_DERIVATION_PARAMS', ({ data }) => handleStoreEncryptionKeyDerivationParams(data as EncryptionKeyDerivationParams));

    onMessage('CREATE_IDENTITY', ({ data }) => handleCreateIdentity(data));
    onMessage('UPLOAD_VAULT', ({ data }) => handleUploadVault(data));
    onMessage('SYNC_VAULT', () => handleSyncVault());

    onMessage('CLEAR_VAULT', () => handleClearVault());

    onMessage('OPEN_POPUP', () => handleOpenPopup());
    onMessage('OPEN_POPUP_WITH_CREDENTIAL', ({ data }) => handlePopupWithCredential(data));
    onMessage('TOGGLE_CONTEXT_MENU', ({ data }) => handleToggleContextMenu(data));

    onMessage('PERSIST_FORM_VALUES', ({ data }) => handlePersistFormValues(data));
    onMessage('GET_PERSISTED_FORM_VALUES', () => handleGetPersistedFormValues());
    onMessage('CLEAR_PERSISTED_FORM_VALUES', () => handleClearPersistedFormValues());

    // Clipboard management messages
    onMessage('CLIPBOARD_COPIED', () => handleClipboardCopied());
    onMessage('CANCEL_CLIPBOARD_CLEAR', () => handleCancelClipboardClear());
    onMessage('GET_CLIPBOARD_CLEAR_TIMEOUT', () => handleGetClipboardClearTimeout());
    onMessage('SET_CLIPBOARD_CLEAR_TIMEOUT', ({ data }) => handleSetClipboardClearTimeout(data as number));
    onMessage('GET_CLIPBOARD_COUNTDOWN_STATE', () => handleGetClipboardCountdownState());

    // Also handle runtime messages from content scripts
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'CLIPBOARD_COPIED_FROM_CONTEXT') {
        // Trigger the same clipboard clear logic
        handleClipboardCopied();
      }
    });

    // Setup context menus
    const isContextMenuEnabled = await storage.getItem(GLOBAL_CONTEXT_MENU_ENABLED_KEY) ?? true;
    if (isContextMenuEnabled) {
      await setupContextMenus();
    }

    // Listen for custom commands
    try {
      browser.commands.onCommand.addListener(async (command) => {
        if (command === "show-autofill-popup") {
          // Get the currently active tab
          const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (!tab?.id) {
            return;
          }

          // Execute script in the active tab
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            func: getActiveElementIdentifier,
          }).then((results) => {
            const elementIdentifier = results[0]?.result;
            if (elementIdentifier) {
              sendMessage('OPEN_AUTOFILL_POPUP', { elementIdentifier }, `content-script@${tab.id}`);
            }
          }).catch(console.error);
        }
      });
    } catch (error) {
      console.error('Error setting up command listener:', error);
    }
  }
});

/**
 * Activate AliasVault for the active input element.
 */
function getActiveElementIdentifier() : string {
  const target = document.activeElement;
  if (target instanceof HTMLInputElement) {
    return target.id || target.name || '';
  }
  return '';
}

/**
 * Create offscreen document if it doesn't exist.
 */
async function createOffscreenDocument(): Promise<void> {
  if (offscreenDocumentCreated) {
    return;
  }

  try {
    // Check if chrome.offscreen API is available (Chrome 109+)
    if (!chrome.offscreen) {
      console.warn('[CLIPBOARD] Offscreen API not available, falling back to direct clipboard access');
      return;
    }

    // Check if offscreen document already exists
    if (chrome.runtime.getContexts) {
      const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL('offscreen.html')]
      });

      if (existingContexts.length > 0) {
        offscreenDocumentCreated = true;
        return;
      }
    }

    // Create offscreen document
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'Clear clipboard after timeout for security'
    });

    offscreenDocumentCreated = true;
  } catch (error) {
    console.error('[CLIPBOARD] Failed to create offscreen document:', error);
    offscreenDocumentCreated = false;
  }
}

/**
 * Clear clipboard using offscreen document or fallback method.
 */
async function clearClipboardContent(): Promise<void> {
  if (import.meta.env.CHROME || import.meta.env.EDGE) {
    /*
     * Chrome and Edge use mv3 and do not have direct access to clipboard
     * so we use an offscreen document to clear the clipboard.
     */
    await createOffscreenDocument();

    // Send message to offscreen document to clear clipboard
    const response = await chrome.runtime.sendMessage({ type: 'CLEAR_CLIPBOARD' });

    if (response?.success) {
      console.info('[CLIPBOARD] Clipboard cleared via offscreen document');
    } else {
      throw new Error(response?.message || 'Failed to clear clipboard via offscreen');
    }
  } else {
    // Firefox and Safari use mv2 and do not have offscreen document support, use direct clipboard access.
    await navigator.clipboard.writeText('');
  }
}

/**
 * Handle clipboard copied event - starts countdown and timer to clear clipboard.
 */
async function handleClipboardCopied() : Promise<void> {
  const timeout = await storage.getItem(CLIPBOARD_CLEAR_TIMEOUT_KEY) as number ?? 10;

  // Clear any existing timer
  if (clipboardClearTimer) {
    clearTimeout(clipboardClearTimer);
    clipboardClearTimer = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  // Don't set timer if timeout is 0 (disabled)
  if (timeout === 0) {
    return;
  }

  // Generate new countdown ID
  currentCountdownId = Date.now();
  const thisCountdownId = currentCountdownId;
  countdownStartTime = Date.now();
  totalCountdownTime = timeout;

  remainingTime = timeout;

  // Send initial countdown immediately with ID
  sendMessage('CLIPBOARD_COUNTDOWN', { remaining: remainingTime, total: timeout, id: thisCountdownId }, 'popup').catch(() => {});

  // Send countdown updates to popup every 100ms for smooth animation
  let elapsed = 0;
  countdownInterval = setInterval(() => {
    // Check if this countdown is still active
    if (thisCountdownId !== currentCountdownId) {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      return;
    }

    elapsed += 0.1;
    remainingTime = Math.max(0, timeout - elapsed);
    sendMessage('CLIPBOARD_COUNTDOWN', { remaining: remainingTime, total: timeout, id: thisCountdownId }, 'popup').catch(() => {});

    if (elapsed >= timeout && countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }, 100);

  // Set timer to clear clipboard
  clipboardClearTimer = setTimeout(async () => {
    try {
      // Clear clipboard using offscreen document or fallback
      await clearClipboardContent();

      // Clean up regardless of success/failure
      clipboardClearTimer = null;
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }

      // Reset countdown tracking
      currentCountdownId = 0;
      countdownStartTime = 0;
      totalCountdownTime = 0;

      sendMessage('CLIPBOARD_CLEARED', {}, 'popup').catch(() => {});
    } catch (error) {
      console.error('[CLIPBOARD] Error during clipboard clear:', error);

      // Clean up even on error
      clipboardClearTimer = null;
      if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
      currentCountdownId = 0;
      countdownStartTime = 0;
      totalCountdownTime = 0;
      sendMessage('CLIPBOARD_CLEARED', {}, 'popup').catch(() => {});
    }
  }, timeout * 1000);
}

/**
 * Cancel clipboard clear countdown and timer.
 */
function handleCancelClipboardClear(): void {
  if (clipboardClearTimer) {
    clearTimeout(clipboardClearTimer);
    clipboardClearTimer = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  sendMessage('CLIPBOARD_COUNTDOWN_CANCELLED', {}, 'popup').catch(() => {});
}

/**
 * Get the clipboard clear timeout setting.
 */
async function handleGetClipboardClearTimeout(): Promise<number> {
  const timeout = await storage.getItem(CLIPBOARD_CLEAR_TIMEOUT_KEY) as number ?? 10;
  return timeout;
}

/**
 * Set the clipboard clear timeout setting.
 */
async function handleSetClipboardClearTimeout(data: number): Promise<boolean> {
  await storage.setItem(CLIPBOARD_CLEAR_TIMEOUT_KEY, data);
  return true;
}

/**
 * Get the current clipboard countdown state.
 */
function handleGetClipboardCountdownState(): { remaining: number; total: number; id: number } | null {
  // Calculate actual remaining time based on elapsed time
  if (currentCountdownId && countdownStartTime && totalCountdownTime) {
    const elapsed = (Date.now() - countdownStartTime) / 1000;
    const actualRemaining = Math.max(0, totalCountdownTime - elapsed);

    if (actualRemaining > 0) {
      return {
        remaining: actualRemaining,
        total: totalCountdownTime,
        id: currentCountdownId
      };
    }
  }
  return null;
}