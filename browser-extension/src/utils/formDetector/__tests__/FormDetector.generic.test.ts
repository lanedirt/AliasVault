import { describe, it, expect } from 'vitest';
import { createTestDom } from './TestUtils';
import { FormDetector } from '../FormDetector';

describe('FormDetector generic tests', () => {
  describe('Invalid form not detected as login form 1', () => {
    const htmlFile = 'invalid-form1.html';

    it('should not detect any forms', () => {
      const dom = createTestDom(htmlFile);
      const document = dom.window.document;
      const formDetector = new FormDetector(document);
      const form = formDetector.containsLoginForm();
      expect(form).toBe(false);
    });
  });

  describe('Invalid form not detected as login form 2', () => {
    const htmlFile = 'invalid-form2.html';

    it('should not detect any forms even when clicking search input', () => {
      const dom = createTestDom(htmlFile);
      const document = dom.window.document;

      // Pass the search input as the clicked element to test if it's still not detected as a login form.
      const searchInput = document.getElementById('js-issues-search');
      const formDetector = new FormDetector(document, searchInput as HTMLElement);
      const form = formDetector.containsLoginForm();
      expect(form).toBe(false);
    });
  });

  describe('Form with autocomplete="off" not detected', () => {
    const htmlFile = 'autocomplete-off.html';

    it('should not detect form with autocomplete="off" on email field', () => {
      const dom = createTestDom(htmlFile);
      const document = dom.window.document;
      const formDetector = new FormDetector(document);
      const form = formDetector.containsLoginForm();
      expect(form).toBe(false);
    });
  });

  describe('Form with display:none not detected', () => {
    const htmlFile = 'display-none.html';

    it('should not detect form with display:none', () => {
      const dom = createTestDom(htmlFile);
      const document = dom.window.document;
      const formDetector = new FormDetector(document);
      const form = formDetector.containsLoginForm();
      expect(form).toBe(false);
    });
  });

  describe('Form with visibility:hidden not detected', () => {
    const htmlFile = 'visibility-hidden.html';

    it('should not detect form with visibility:hidden', () => {
      const dom = createTestDom(htmlFile);
      const document = dom.window.document;
      const formDetector = new FormDetector(document);
      const form = formDetector.containsLoginForm();
      expect(form).toBe(false);
    });
  });

  describe('Form with opacity:0 not detected', () => {
    const htmlFile = 'opacity-zero.html';

    it('should not detect form with opacity:0', () => {
      const dom = createTestDom(htmlFile);
      const document = dom.window.document;
      const formDetector = new FormDetector(document);
      const form = formDetector.containsLoginForm();
      expect(form).toBe(false);
    });
  });
});
