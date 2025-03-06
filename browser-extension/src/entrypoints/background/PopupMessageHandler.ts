/* eslint-disable @typescript-eslint/no-explicit-any */
import { browser } from "wxt/browser";
import { BoolResponse } from '../../utils/types/messaging/BoolResponse';
/**
 * Handle opening the popup.
 */
export function handleOpenPopup() : Promise<BoolResponse> {
  return (async () => {
    browser.windows.create({
      url: browser.runtime.getURL('/popup.html?mode=inline_unlock'),
      type: 'popup',
      width: 400,
      height: 600,
      focused: true
    });
    return { success: true };
  })();
}

/**
 * Handle opening the popup with a credential.
 */
export function handlePopupWithCredential(message: any) : Promise<BoolResponse> {
  return (async () => {
    browser.windows.create({
      url: browser.runtime.getURL(`/popup.html#/credentials/${message.credentialId}`),
      type: 'popup',
      width: 400,
      height: 600,
      focused: true
    });
    return { success: true };
  })();
}