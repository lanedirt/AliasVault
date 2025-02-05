import { PasswordGenerator } from '../generators/Password/PasswordGenerator';

/**
 * Setup the context menus.
 */
export function setupContextMenus() : void {
  chrome.contextMenus.create({
    id: "aliasvault-root",
    title: "AliasVault",
    contexts: ["all"]
  });

  chrome.contextMenus.create({
    id: "aliasvault-generate-password",
    parentId: "aliasvault-root",
    title: "Generate Password (copy to clipboard)",
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