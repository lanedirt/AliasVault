import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

import { FormDetector } from '../FormDetector';

describe('FormDetector Shadow DOM tests', () => {
  it('should detect faceplate-text-input with actual shadow DOM as autofill triggerable field', () => {
    const html = `
      <form>
        <fieldset>
          <faceplate-text-input id="login-username" name="username" autocomplete="username" required="">
            <span slot="label">Email or username</span>
          </faceplate-text-input>
        </fieldset>
      </form>
    `;

    const dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    const document = dom.window.document;

    // Get the custom element
    const faceplateElement = document.getElementById('login-username');
    expect(faceplateElement).toBeTruthy();
    expect(faceplateElement?.tagName.toLowerCase()).toBe('faceplate-text-input');

    // Create shadow DOM like Reddit's actual implementation
    const shadowRoot = faceplateElement!.attachShadow({ mode: 'open' });

    // Create the internal input element that would exist in the shadow DOM
    const shadowHTML = `
      <div class="faceplate-input-wrapper">
        <input type="text" name="username" autocomplete="username" class="faceplate-input" />
        <slot name="label"></slot>
      </div>
    `;
    shadowRoot.innerHTML = shadowHTML;

    // Verify shadow DOM was created correctly
    const shadowInput = shadowRoot.querySelector('input');
    expect(shadowInput).toBeTruthy();
    expect(shadowInput?.type).toBe('text');

    // Create a FormDetector with the custom element
    const detector = new FormDetector(document, faceplateElement as HTMLElement);

    // Should detect it as an autofill triggerable field
    expect(detector.isAutofillTriggerableField()).toBe(true);
  });

  it('should detect faceplate-text-input with type attribute fallback as autofill triggerable field', () => {
    const html = `
      <form>
        <fieldset>
          <faceplate-text-input id="login-username" type="text" name="username" autocomplete="username" required="">
            <span slot="label">Email or username</span>
          </faceplate-text-input>
        </fieldset>
      </form>
    `;

    const dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    const document = dom.window.document;

    // Get the custom element
    const faceplateElement = document.getElementById('login-username');
    expect(faceplateElement).toBeTruthy();
    expect(faceplateElement?.tagName.toLowerCase()).toBe('faceplate-text-input');

    // Create a FormDetector with the custom element (without shadow DOM for this test)
    const detector = new FormDetector(document, faceplateElement as HTMLElement);

    // Should detect it as an autofill triggerable field using type attribute
    expect(detector.isAutofillTriggerableField()).toBe(true);
  });

  it('should detect faceplate-text-input with password shadow DOM as triggerable field', () => {
    const html = `
      <form>
        <fieldset>
          <faceplate-text-input id="login-password" name="password" autocomplete="current-password">
            <span slot="label">Password</span>
          </faceplate-text-input>
        </fieldset>
      </form>
    `;

    const dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    const document = dom.window.document;

    const faceplateElement = document.getElementById('login-password');

    // Create shadow DOM with password input (like Reddit's actual implementation)
    const shadowRoot = faceplateElement!.attachShadow({ mode: 'open' });
    const shadowHTML = `
      <div class="faceplate-input-wrapper">
        <input type="password" name="password" autocomplete="current-password" class="faceplate-input" />
        <slot name="label"></slot>
      </div>
    `;
    shadowRoot.innerHTML = shadowHTML;

    // Verify shadow DOM password input
    const shadowInput = shadowRoot.querySelector('input');
    expect(shadowInput?.type).toBe('password');

    const detector = new FormDetector(document, faceplateElement as HTMLElement);

    expect(detector.isAutofillTriggerableField()).toBe(true);
  });

  it('should detect custom element with email type as triggerable field', () => {
    const html = `
      <form>
        <custom-input id="email-field" type="email" name="email">
          <span slot="label">Email Address</span>
        </custom-input>
      </form>
    `;

    const dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    const document = dom.window.document;

    const customElement = document.getElementById('email-field');
    const detector = new FormDetector(document, customElement as HTMLElement);

    expect(detector.isAutofillTriggerableField()).toBe(true);
  });

  it('should not detect non-input custom elements as triggerable fields', () => {
    const html = `
      <form>
        <custom-button id="submit-btn" type="button">
          <span>Submit</span>
        </custom-button>
      </form>
    `;

    const dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    const document = dom.window.document;

    const customButton = document.getElementById('submit-btn');
    const detector = new FormDetector(document, customButton as HTMLElement);

    expect(detector.isAutofillTriggerableField()).toBe(false);
  });

  it('should handle real Reddit-like login form with shadow DOM', () => {
    const html = `
      <form>
        <fieldset class="relative mt-0 mb-0 ml-0 mr-0 p-0 border-0 flex flex-col flex-grow bg-transparent">
          <faceplate-text-input id="login-username" name="username" autocomplete="username" required=""
                                helper-text-placeholder="&nbsp;" aria-disabled="false" helper-text-aria-live="polite"
                                appearance="secondary" faceplate-validity="invalid">
            <span slot="label">Email or username</span>
          </faceplate-text-input>
        </fieldset>
        <fieldset class="relative mt-0 mb-0 ml-0 mr-0 p-0 border-0 flex flex-col flex-grow bg-transparent">
          <faceplate-text-input id="login-password" name="password" autocomplete="current-password" required=""
                                helper-text-placeholder="&nbsp;" aria-disabled="false" helper-text-aria-live="polite"
                                appearance="secondary">
            <span slot="label">Password</span>
          </faceplate-text-input>
        </fieldset>
      </form>
    `;

    const dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    const document = dom.window.document;

    // Set up shadow DOM for username field (no type attribute, just like Reddit)
    const usernameElement = document.getElementById('login-username');
    const usernameShadowRoot = usernameElement!.attachShadow({ mode: 'open' });
    usernameShadowRoot.innerHTML = `
      <div class="faceplate-input-wrapper">
        <input type="text" name="username" autocomplete="username" class="faceplate-input" />
        <slot name="label"></slot>
        <div class="faceplate-input-decorations"></div>
      </div>
    `;

    // Set up shadow DOM for password field (no type attribute, just like Reddit)
    const passwordElement = document.getElementById('login-password');
    const passwordShadowRoot = passwordElement!.attachShadow({ mode: 'open' });
    passwordShadowRoot.innerHTML = `
      <div class="faceplate-input-wrapper">
        <input type="password" name="password" autocomplete="current-password" class="faceplate-input" />
        <slot name="label"></slot>
        <div class="faceplate-input-decorations"></div>
      </div>
    `;

    // Test username field detection
    const usernameDetector = new FormDetector(document, usernameElement as HTMLElement);
    expect(usernameDetector.containsLoginForm()).toBe(true);
    expect(usernameDetector.isAutofillTriggerableField()).toBe(true);

    // Test password field detection
    const passwordDetector = new FormDetector(document, passwordElement as HTMLElement);
    expect(passwordDetector.containsLoginForm()).toBe(true);
    expect(passwordDetector.isAutofillTriggerableField()).toBe(true);

    // Test form extraction
    const form = usernameDetector.getForm();
    expect(form).toBeTruthy();

    /**
     * The form should be able to detect both username and password fields
     * Note: Since the custom elements are now recognized, they should be included in the form detection
     */
    expect(form?.form).toBeTruthy();
  });

  it('should handle custom elements in form detection with type attributes', () => {
    const html = `
      <form>
        <fieldset>
          <faceplate-text-input id="username-field" type="text" name="username">
            <span slot="label">Username</span>
          </faceplate-text-input>
        </fieldset>
        <fieldset>
          <faceplate-text-input id="password-field" type="password" name="password">
            <span slot="label">Password</span>
          </faceplate-text-input>
        </fieldset>
      </form>
    `;

    const dom = new JSDOM(html, {
      url: 'http://localhost',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    const document = dom.window.document;

    const usernameElement = document.getElementById('username-field');
    const detector = new FormDetector(document, usernameElement as HTMLElement);

    // Should contain login form
    expect(detector.containsLoginForm()).toBe(true);

    // Should detect the field as triggerable
    expect(detector.isAutofillTriggerableField()).toBe(true);

    // Should be able to get form
    const form = detector.getForm();
    expect(form).toBeTruthy();
  });
});
