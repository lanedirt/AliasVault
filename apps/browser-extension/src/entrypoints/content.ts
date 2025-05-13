import '@/entrypoints/contentScript/style.css';
import { FormDetector } from '@/utils/formDetector/FormDetector';
import { isAutoShowPopupEnabled, openAutofillPopup, removeExistingPopup } from '@/entrypoints/contentScript/Popup';
import { injectIcon, popupDebounceTimeHasPassed, validateInputField } from '@/entrypoints/contentScript/Form';
import { onMessage } from "webext-bridge/content-script";
import { BoolResponse as messageBoolResponse } from '@/utils/types/messaging/BoolResponse';
import { defineContentScript } from '#imports';
import { createShadowRootUi } from '#imports';

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
      position: 'overlay',
      alignment: 'top-left',
      zIndex: 2147483646,
      anchor: 'html',
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
          const avDisable = ((e.target as HTMLElement).getAttribute('av-disable') ?? document.body?.getAttribute('av-disable') ?? document.documentElement.getAttribute('av-disable')) === 'true';
          if (avDisable) {
            return;
          }

          const { isValid, inputElement } = validateInputField(e.target as Element);
          if (isValid && inputElement) {
            const formDetector = new FormDetector(document, inputElement);
            if (!formDetector.containsLoginForm()) {
              return;
            }

            // Only inject icon and show popup if autofill popup is enabled
            if (await isAutoShowPopupEnabled()) {
              injectIcon(inputElement, container);

              // Only show popup if debounce time has passed
              if (popupDebounceTimeHasPassed()) {
                openAutofillPopup(inputElement, container);
              }
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
          const { isValid, inputElement } = validateInputField(target);

          if (!isValid || !inputElement) {
            return { success: false, error: 'Target element is not a supported input field' };
          }

          const formDetector = new FormDetector(document, inputElement);
          if (!formDetector.containsLoginForm()) {
            return { success: false, error: 'No form found' };
          }

          // This is an explicit call by the user to open the popup, so we don't check if it's enabled.
          injectIcon(inputElement, container);
          openAutofillPopup(inputElement, container);
          return { success: true };
        });
      },
    });

    // Mount the UI to create the shadow root
    ui.autoMount();
  },
});