/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Handle opening the popup.
 */
export function handleOpenPopup(message: any, sendResponse: (response: any) => void) : void {
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
export function handlePopupWithCredential(message: any, sendResponse: (response: any) => void) : void {
  chrome.windows.create({
    url: chrome.runtime.getURL(`index.html?popup=true#/credentials/${message.credentialId}`),
    type: 'popup',
    width: 400,
    height: 600,
    focused: true
  });
  sendResponse({ success: true });
}