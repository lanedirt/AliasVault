/* eslint-disable @typescript-eslint/no-explicit-any */
import { VaultState } from "./VaultState";

/**
 * Handle opening the popup.
 */
export function handleOpenPopup(message: any, vaultState: VaultState, sendResponse: (response: any) => void) : void {
  chrome.windows.create({
    url: chrome.runtime.getURL('index.html?mode=inline_unlock'),
    type: 'popup',
    width: 400,
    height: 600,
    focused: true
  });
  sendResponse({ success: true });
}

/**
 * Handle opening the popup with a credential.
 */
export function handlePopupWithCredential(message: any, vaultState: VaultState, sendResponse: (response: any) => void) : void {
  chrome.windows.create({
    url: chrome.runtime.getURL(`index.html#credentials/${message.credentialId}`),
    type: 'popup',
    width: 400,
    height: 600,
    focused: true
  });
  sendResponse({ success: true });
}