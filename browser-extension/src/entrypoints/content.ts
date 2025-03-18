import './contentScript/style.css';
import { FormDetector } from '../utils/formDetector/FormDetector';
import { isAutoShowPopupEnabled, openAutofillPopup, removeExistingPopup } from './contentScript/Popup';
import { injectIcon, popupDebounceTimeHasPassed } from './contentScript/Form';
import { onMessage } from "webext-bridge/content-script";
import { BoolResponse as messageBoolResponse } from '../utils/types/messaging/BoolResponse';
import { defineContentScript } from 'wxt/sandbox';
import { createShadowRootUi } from 'wxt/client';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  allFrames: true,
  matchAboutBlank: true,
  runAt: 'document_start',

  /**
   * Main entry point for the content script.
   */
  async main(ctx) {
    if (ctx.isInvalid) {
      return;
    }

    // Create a shadow root UI for isolation
    const ui = await createShadowRootUi(ctx, {
      name: 'aliasvault-ui',
      position: 'inline',
      anchor: 'body',
      /**
       * Handle mount.
       */
      onMount(container) {
        /**
         * Handle input field focus.
         */
        const handleFocusIn = async (e: FocusEvent) : Promise<void> => {
          if (ctx.isInvalid) {
            return;
          }

          // Check if element itself, html or body has av-disable attribute like av-disable="true"
          const avDisable = (e.target as HTMLElement).getAttribute('av-disable') ?? document.body?.getAttribute('av-disable') ?? document.documentElement.getAttribute('av-disable');
          if (avDisable === 'true') {
            return;
          }

          const target = e.target as HTMLInputElement;
          const textInputTypes = ['text', 'email', 'tel', 'password', 'search', 'url'];

          if (target.tagName === 'INPUT' && textInputTypes.includes(target.type) && !target.dataset.aliasvaultIgnore) {
            const formDetector = new FormDetector(document, target);
            if (!formDetector.containsLoginForm()) {
              return;
            }

            injectIcon(target, container);

            // Only show popup if its enabled and debounce time has passed.
            if (await isAutoShowPopupEnabled() && popupDebounceTimeHasPassed()) {
              openAutofillPopup(target, container);
            }
          }
        };

        // Listen for input field focus in the main document
        document.addEventListener('focusin', handleFocusIn);

        // Listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', () => {
          if (ctx.isInvalid) {
            return;
          }

          removeExistingPopup(container);
        });

        // Listen for messages from the background script
        onMessage('OPEN_AUTOFILL_POPUP', async (message: { data: { elementIdentifier: string } }) : Promise<messageBoolResponse> => {
          const { data } = message;
          const { elementIdentifier } = data;

          if (!elementIdentifier) {
            return { success: false, error: 'No element identifier provided' };
          }

          const target = document.getElementById(elementIdentifier) ?? document.getElementsByName(elementIdentifier)[0];

          if (!(target instanceof HTMLInputElement)) {
            return { success: false, error: 'Target element is not an input field' };
          }

          const formDetector = new FormDetector(document, target);

          if (!formDetector.containsLoginForm(true)) {
            return { success: false, error: 'No form found' };
          }

          injectIcon(target, container);
          openAutofillPopup(target, container);
          return { success: true };
        });
      },
    });

    // Mount the UI to create the shadow root
    ui.autoMount();
  },
});