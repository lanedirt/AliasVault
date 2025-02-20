import { PasswordGenerator } from '../shared/generators/Password/PasswordGenerator';

/**
 * Setup the context menus.
 */
export function setupContextMenus() : void {
  // Create root menu
  chrome.contextMenus.create({
    id: "aliasvault-root",
    title: "AliasVault",
    contexts: ["all"]
  });

  // Add fill option first (only for editable fields)
  chrome.contextMenus.create({
    id: "aliasvault-activate-form",
    parentId: "aliasvault-root",
    title: "Autofill with AliasVault",
    contexts: ["editable"],
  });

  // Add separator (only for editable fields)
  chrome.contextMenus.create({
    id: "aliasvault-separator",
    parentId: "aliasvault-root",
    type: "separator",
    contexts: ["editable"],
  });

  // Add password generator option
  chrome.contextMenus.create({
    id: "aliasvault-generate-password",
    parentId: "aliasvault-root",
    title: "Generate random password (copy to clipboard)",
    contexts: ["all"]
  });
}

/**
 * Handle context menu clicks.
 */
export function handleContextMenuClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) : void {
  if (info.menuItemId === "aliasvault-generate-password") {
    // Initialize password generator
    const passwordGenerator = new PasswordGenerator();
    const password = passwordGenerator.generateRandomPassword();

    // Use chrome.scripting to write password to clipboard from active tab
    if (tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: copyPasswordToClipboard,
        args: [password]
      });
    }
  }

  if (info.menuItemId === "aliasvault-activate-form" && tab?.id) {
    // First get the active element's identifier
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getActiveElementIdentifier,
    }, (results) => {
      const elementIdentifier = results[0]?.result;
      if (elementIdentifier) {
        // Then send message to content script with proper error handling
        chrome.tabs.sendMessage(
          tab.id,
          {
            type: 'OPEN_ALIASVAULT_POPUP',
            elementIdentifier
          }
        ).catch(error => {
          console.error('Error sending message to content script:', error);
        });
      }
    });
  }
}

/**
 * Copy provided password to clipboard.
 */
function copyPasswordToClipboard(generatedPassword: string) : void {
  navigator.clipboard.writeText(generatedPassword).then(() => {
    showToast('Password copied to clipboard');
  });

  /**
   * Show a toast notification.
   */
  function showToast(message: string) : void {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px;
        background: #4CAF50;
        color: white;
        border-radius: 4px;
        z-index: 9999;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

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