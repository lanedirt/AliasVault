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

    // Wait for 750ms to give the host page time to load and to increase the chance that the body is available and ready.
    await new Promise(resolve => setTimeout(resolve, 750));

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

            // Only show popup for autofill-triggerable fields
            if (!formDetector.isAutofillTriggerableField()) {
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

        // Check if currently something is focused, if so, apply check for that element
        const currentFocusedElement = document.activeElement;
        if (currentFocusedElement) {
          showPopupForElement(currentFocusedElement);
        }

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

          await showPopupForElement(target, true);

          return { success: true };
        });

        /**
         * Show popup for element.
         */
        async function showPopupForElement(element: Element, forceShow: boolean = false) : Promise<void> {
          const { isValid, inputElement } = validateInputField(element);

          if (!isValid || !inputElement) {
            return;
          }

          const formDetector = new FormDetector(document, inputElement);
          if (!formDetector.containsLoginForm()) {
            return;
          }

          /**
           * By default we check if the popup is not disabled (for current site) and if the field is autofill-triggerable
           * but if forceShow is true, we show the popup regardless.
           */
          const canShowPopup = forceShow || (await isAutoShowPopupEnabled() && formDetector.isAutofillTriggerableField());

          if (canShowPopup) {
            injectIcon(inputElement, container);
            openAutofillPopup(inputElement, container);
          }
        }
      },
    });

    // Mount the UI to create the shadow root
    ui.autoMount();
  },
});