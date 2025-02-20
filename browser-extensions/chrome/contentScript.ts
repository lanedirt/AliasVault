import { FormDetector } from './src/shared/formDetector/FormDetector';
import { isAutoShowPopupDisabled, openAutofillPopup, removeExistingPopup } from './src/contentScript/Popup';
import { canShowPopup, injectIcon } from './src/contentScript/Form';

/**
 * Listen for input field focus
 */
document.addEventListener('focusin', async (e) => {
  const target = e.target as HTMLInputElement;
  const textInputTypes = ['text', 'email', 'tel', 'password', 'search', 'url'];

  if (target.tagName === 'INPUT' &&
      textInputTypes.includes(target.type) &&
      !target.dataset.aliasvaultIgnore) {
    const formDetector = new FormDetector(document, target);
    const forms = formDetector.detectForms();

    if (!forms.length) return;

    injectIcon(target);

    const isDisabled = await isAutoShowPopupDisabled();
    const canShow = canShowPopup();

    // Only show popup if it's not disabled and the popup can be shown (not blocked by debounce)
    if (!isDisabled && canShow) {
      openAutofillPopup(target);
    }
  }
});

/**
 * Listen for popstate events (back/forward navigation)
 */
window.addEventListener('popstate', () => {
  removeExistingPopup();
});

/**
 * Listen for messages from the background script context menu
 * to open the AliasVault popup on a specific element.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_ALIASVAULT_POPUP') {
    const elementIdentifier = message.elementIdentifier;
    if (elementIdentifier) {
      const target = document.getElementById(elementIdentifier) ||
                    document.getElementsByName(elementIdentifier)[0];

      if (target instanceof HTMLInputElement) {
        // Inject icon
        injectIcon(target);
        // Force open the popup
        openAutofillPopup(target, true);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Target element is not an input field' });
      }
    } else {
      sendResponse({ success: false, error: 'No element identifier provided' });
    }
  }

  // Must return true if response is sent asynchronously
  return true;
});