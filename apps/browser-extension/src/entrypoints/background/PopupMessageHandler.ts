/* eslint-disable @typescript-eslint/no-explicit-any */
import { browser } from '#imports';
import { BoolResponse } from '@/utils/types/messaging/BoolResponse';
import { setupContextMenus } from './ContextMenu';

/**
 * Handle opening the popup.
 */
export function handleOpenPopup() : Promise<BoolResponse> {
  return (async () : Promise<BoolResponse> => {
    browser.windows.create({
      url: browser.runtime.getURL('/popup.html?mode=inline_unlock&expanded=true'),
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
  return (async () : Promise<BoolResponse> => {
    browser.windows.create({
      url: browser.runtime.getURL(`/popup.html?expanded=true#/credentials/${message.credentialId}`),
      type: 'popup',
      width: 400,
      height: 600,
      focused: true
    });
    return { success: true };
  })();
}

/**
 * Handle toggling the context menu.
 */
export function handleToggleContextMenu(message: any) : Promise<BoolResponse> {
  return (async () : Promise<BoolResponse> => {
    if (!message.enabled) {
      browser.contextMenus.removeAll();
    } else {
      setupContextMenus();
    }
    return { success: true };
  })();
}