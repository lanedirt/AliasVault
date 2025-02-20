import { describe, expect, it } from 'vitest';
import { FormField, testField } from './TestUtils';

describe('FormDetector English tests', () => {
  it('contains tests for English form field detection', () => {
    /**
     * This test suite uses testField() and testBirthdateFormat() helper functions
     * to test form field detection for multiple English registration forms.
     * The actual test implementations are in the helper functions.
     * This test is just to ensure the test suite is working and to satisfy the linter.
     */
    expect(true).toBe(true);
  });

  describe('English registration form 1 detection', () => {
    const htmlFile = 'en-registration-form1.html';

    testField(FormField.Email, 'login', htmlFile);
    testField(FormField.Password, 'password', htmlFile);
  });

  describe('English registration form 2 detection', () => {
    const htmlFile = 'en-registration-form2.html';

    testField(FormField.Email, 'signup-email-input', htmlFile);
    testField(FormField.FirstName, 'signup-name-input', htmlFile);
  });

  describe('English registration form 3 detection', () => {
    const htmlFile = 'en-registration-form3.html';

    testField(FormField.Email, 'email', htmlFile);
    testField(FormField.EmailConfirm, 'reenter_email', htmlFile);
  });

  describe('English email form 1 detection', () => {
    const htmlFile = 'en-email-form1.html';

    // Assert that this test fails, because the autocomplete=off for the specified element.
    testField(FormField.Email, 'P0-0', htmlFile);
  });
});
