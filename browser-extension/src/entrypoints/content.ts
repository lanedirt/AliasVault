import { FormDetector } from '../utils/formDetector/FormDetector';
import { isAutoShowPopupDisabled, openAutofillPopup, removeExistingPopup } from './contentScript/Popup';
import { canShowPopup, injectIcon } from './contentScript/Form';
import { onMessage } from "webext-bridge/content-script";

export default defineContentScript({
  matches: ['<all_urls>'],
  /**
   *
   */
  main(ctx) {
    if (ctx.isInvalid) {
      return;
    }

    // Listen for input field focus
    document.addEventListener('focusin', async (e) => {
      if (ctx.isInvalid) {
        return;
      }

      const target = e.target as HTMLInputElement;
      const textInputTypes = ['text', 'email', 'tel', 'password', 'search', 'url'];

      if (target.tagName === 'INPUT' &&
          textInputTypes.includes(target.type) &&
          !target.dataset.aliasvaultIgnore) {
        const formDetector = new FormDetector(document, target);

        if (!formDetector.containsLoginForm()) {
          return;
        }

        injectIcon(target);

        const isDisabled = await isAutoShowPopupDisabled();
        const canShow = canShowPopup();

        // Only show popup if it's not disabled and the popup can be shown
        if (!isDisabled && canShow) {
          openAutofillPopup(target);
        }
      }
    });

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      if (ctx.isInvalid) {
        return;
      }

      removeExistingPopup();
    });

    // Listen for messages from the background script
    onMessage('OPEN_AUTOFILL_POPUP', async (message: any) => {
      const { data, sender } = message;
      const { elementIdentifier } = data;

      if (!elementIdentifier) {
        return { success: false, error: 'No element identifier provided' };
      }

      const target = document.getElementById(elementIdentifier) ||
                    document.getElementsByName(elementIdentifier)[0];

      if (!(target instanceof HTMLInputElement)) {
        return { success: false, error: 'Target element is not an input field' };
      }

      const formDetector = new FormDetector(document, target);

      if (!formDetector.containsLoginForm(true)) {
        return { success: false, error: 'No form found' };
      }

      injectIcon(target);
      openAutofillPopup(target);
      return { success: true };
    });
  },
});