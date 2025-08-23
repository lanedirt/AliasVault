import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

import { FormDetector } from '../FormDetector';

import { FormField, testField } from './TestUtils';

describe('FormDetector Slot-based Form tests', () => {
  it('contains tests for slot-based form field detection', () => {
    /**
     * This test suite verifies that FormDetector can properly detect
     * form fields that use slot-based labels (Web Components pattern).
     * This is common in modern web applications using custom elements.
     */
    expect(true).toBe(true);
  });

  describe('Slot-based login form detection', () => {
    const htmlFile = 'slot-based-form.html';

    testField(FormField.Username, 'login-username', htmlFile);
    testField(FormField.Password, 'login-password', htmlFile);
    testField(FormField.Email, 'email-field', htmlFile);
    testField(FormField.FirstName, 'firstname-field', htmlFile);
    testField(FormField.LastName, 'lastname-field', htmlFile);
  });

  describe('Direct slot label detection', () => {
    it('should detect input field with slot label for username', () => {
      const html = `
        <form>
          <div>
            <input id="test-username" name="user" type="text" />
            <span slot="label">username</span>
          </div>
        </form>
      `;

      const dom = new JSDOM(html, {
        url: 'http://localhost',
        runScripts: 'dangerously',
        resources: 'usable'
      });
      const document = dom.window.document;
      const inputElement = document.getElementById('test-username');

      const detector = new FormDetector(document, inputElement as HTMLElement);
      const form = detector.getForm();

      // Since the slot contains "username", it should be detected as a username field
      expect(form?.usernameField).toBe(inputElement);
    });

    it('should detect email field with slot helper-text', () => {
      const html = `
        <form>
          <web-component id="test-email" type="email">
            <span slot="helper-text">Enter your email address</span>
          </web-component>
        </form>
      `;

      const dom = new JSDOM(html, {
        url: 'http://localhost',
        runScripts: 'dangerously',
        resources: 'usable'
      });
      const document = dom.window.document;
      const inputElement = document.getElementById('test-email');

      const detector = new FormDetector(document, inputElement as HTMLElement);
      const form = detector.getForm();

      expect(form?.emailField).toBe(inputElement);
    });

    it('should detect password field with nested slot label', () => {
      const html = `
        <form>
          <fieldset>
            <custom-password-input id="test-password" type="password">
              <div slot="label">
                <span>Your Password</span>
              </div>
            </custom-password-input>
          </fieldset>
        </form>
      `;

      const dom = new JSDOM(html, {
        url: 'http://localhost',
        runScripts: 'dangerously',
        resources: 'usable'
      });
      const document = dom.window.document;
      const inputElement = document.getElementById('test-password');

      const detector = new FormDetector(document, inputElement as HTMLElement);
      const form = detector.getForm();

      expect(form?.passwordField).toBe(inputElement);
    });
  });

  describe('Slot-based form with regular inputs', () => {
    it('should correctly identify input fields with slot labels', () => {
      const html = `
        <form>
          <div>
            <input id="email-input" type="email" name="email">
            <span slot="label">Email Address</span>
          </div>
          <div>
            <input id="pass-input" type="password" name="password">
            <span slot="label">Password</span>
          </div>
          <div>
            <input id="fname-input" type="text" name="fname">
            <span slot="label">First Name</span>
          </div>
          <div>
            <input id="lname-input" type="text" name="lname">
            <span slot="label">Last Name</span>
          </div>
        </form>
      `;

      const dom = new JSDOM(html, {
        url: 'http://localhost',
        runScripts: 'dangerously',
        resources: 'usable'
      });
      const document = dom.window.document;

      // Test email field detection
      const emailElement = document.getElementById('email-input');
      const emailDetector = new FormDetector(document, emailElement as HTMLElement);
      const emailForm = emailDetector.getForm();
      expect(emailForm?.emailField).toBe(emailElement);

      // Test password field detection
      const passElement = document.getElementById('pass-input');
      const passDetector = new FormDetector(document, passElement as HTMLElement);
      const passForm = passDetector.getForm();
      expect(passForm?.passwordField).toBe(passElement);

      // Test first name field detection
      const fnameElement = document.getElementById('fname-input');
      const fnameDetector = new FormDetector(document, fnameElement as HTMLElement);
      const fnameForm = fnameDetector.getForm();
      expect(fnameForm?.firstNameField).toBe(fnameElement);

      // Test last name field detection
      const lnameElement = document.getElementById('lname-input');
      const lnameDetector = new FormDetector(document, lnameElement as HTMLElement);
      const lnameForm = lnameDetector.getForm();
      expect(lnameForm?.lastNameField).toBe(lnameElement);
    });
  });
});
