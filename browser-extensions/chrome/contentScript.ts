import { FormDetector } from './src/utils/form-detector/FormDetector';
import { isAutoShowPopupDisabled, openAutofillPopup, removeExistingPopup } from './src/contentscript/Popup';
import { injectIcon } from './src/contentscript/Form';

/**
 * Listen for input field focus
 */
document.addEventListener('focusin', async (e) => {
  const target = e.target as HTMLInputElement;
  if (target.tagName === 'INPUT' && !target.dataset.aliasvaultIgnore) {
    const formDetector = new FormDetector(document);
    const forms = formDetector.detectForms();

    if (!forms.length) return;

    injectIcon(target);

    const isDisabled = await isAutoShowPopupDisabled();
    if (!isDisabled) {
      openAutofillPopup(target);
    }
  }
});

// Also listen for popstate events (back/forward navigation)
window.addEventListener('popstate', () => {
  removeExistingPopup();
});