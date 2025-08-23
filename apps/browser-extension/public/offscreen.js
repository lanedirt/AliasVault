/**
 * Offscreen document for clipboard operations.
 * This document runs in a hidden context with access to clipboard operations.
 */

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLEAR_CLIPBOARD') {
    clearClipboard()
      .then(() => {
        sendResponse({ success: true, message: 'Clipboard cleared successfully' });
      })
      .catch((error) => {
        console.error('[OFFSCREEN] Failed to clear clipboard:', error);
        sendResponse({ success: false, message: error.message });
      });
    // Return true to indicate we'll send response asynchronously
    return true;
  }
});

const textEl = document.querySelector('#text');

/**
 * Clear the clipboard by writing a space using execCommand.
 */
async function clearClipboard() {
  try {
    // Use execCommand to clear clipboard
    textEl.value = '\n';
    textEl.select();
    document.execCommand('copy');
  } catch (error) {
    console.error('[OFFSCREEN] Error clearing clipboard:', error);
    throw error;
  }
}