import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormFiller } from '../FormFiller';
import { FormFields } from '../types/FormFields';
import { Credential } from '../../types/Credential';
import { JSDOM, DOMWindow } from 'jsdom';

const { window } = new JSDOM('<!DOCTYPE html>');
global.HTMLSelectElement = window.HTMLSelectElement;
global.HTMLInputElement = window.HTMLInputElement;

describe('FormFiller', () => {
  let mockTriggerInputEvents: ReturnType<typeof vi.fn>;
  let formFields: FormFields;
  let formFiller: FormFiller;
  let mockCredential: Credential;
  let document: Document;
  let window: DOMWindow;

  /**
   * Helper function to check if the trigger input event was called for a field.
   * @param field The field to check.
   * @returns True if the trigger input event was called for the field, false otherwise.
   */
  const wasTriggerCalledFor = (field: HTMLElement | null): boolean => {
    if (!field) {
      return false;
    }
    return mockTriggerInputEvents.mock.calls.some(call => call[0] === field);
  };

  beforeEach(() => {
    // Setup DOM environment with localStorage mock
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      storageQuota: 10000000
    });
    window = dom.window;
    document = window.document;

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    mockTriggerInputEvents = vi.fn();

    // Setup mock form fields
    formFields = {
      form: document.createElement('form'),
      usernameField: document.createElement('input'),
      passwordField: document.createElement('input'),
      passwordConfirmField: document.createElement('input'),
      emailField: document.createElement('input'),
      emailConfirmField: document.createElement('input'),
      fullNameField: document.createElement('input'),
      firstNameField: document.createElement('input'),
      lastNameField: document.createElement('input'),
      birthdateField: {
        single: document.createElement('input'),
        format: 'yyyy-mm-dd',
        day: null,
        month: null,
        year: null
      },
      genderField: {
        type: 'select',
        field: document.createElement('select')
      }
    };

    // Setup mock credential
    mockCredential = {
      Id: '123',
      Username: 'testuser',
      Password: 'testpass',
      Email: 'test@example.com',
      ServiceName: 'Test Service',
      Alias: {
        FirstName: 'John',
        LastName: 'Doe',
        BirthDate: '1991-02-03',
        Gender: 'Male'
      }
    };

    formFiller = new FormFiller(formFields, mockTriggerInputEvents);
  });

  describe('fillBasicFields', () => {
    it('should fill username and trigger event', () => {
      formFiller.fillFields(mockCredential);

      expect(formFields.usernameField?.value).toBe('testuser');
      expect(wasTriggerCalledFor(formFields.usernameField)).toBe(true);
    });
    it('should fill email and confirmation fields', () => {
      formFields.emailConfirmField = document.createElement('input');

      formFiller.fillFields(mockCredential);

      expect(formFields.emailField?.value).toBe('test@example.com');
      expect(formFields.emailConfirmField?.value).toBe('test@example.com');
      expect(wasTriggerCalledFor(formFields.emailField)).toBe(true);
      expect(wasTriggerCalledFor(formFields.emailConfirmField)).toBe(true);
    });

    it('should fill password and confirmation fields', () => {
      formFields.passwordConfirmField = document.createElement('input');

      formFiller.fillFields(mockCredential);

      expect(formFields.passwordField?.value).toBe('testpass');
      expect(formFields.passwordConfirmField?.value).toBe('testpass');
      expect(wasTriggerCalledFor(formFields.passwordField)).toBe(true);
      expect(wasTriggerCalledFor(formFields.passwordConfirmField)).toBe(true);
    });

    it('should fill name fields correctly', () => {
      formFiller.fillFields(mockCredential);

      expect(formFields.fullNameField?.value).toBe('John Doe');
      expect(formFields.firstNameField?.value).toBe('John');
      expect(formFields.lastNameField?.value).toBe('Doe');
      expect(wasTriggerCalledFor(formFields.fullNameField)).toBe(true);
      expect(wasTriggerCalledFor(formFields.firstNameField)).toBe(true);
      expect(wasTriggerCalledFor(formFields.lastNameField)).toBe(true);
    });
  });

  describe('fillBirthdateFields', () => {
    it('should fill single birthdate field with correct format', () => {
      formFiller.fillFields(mockCredential);

      expect(formFields.birthdateField.single?.value).toBe('1991-02-03');
      expect(wasTriggerCalledFor(formFields.birthdateField.single)).toBe(true);
    });

    it('should handle different date formats', () => {
      formFields.birthdateField.format = 'dd/mm/yyyy';

      formFiller.fillFields(mockCredential);

      expect(formFields.birthdateField.single?.value).toBe('03/02/1991');
    });

    it('should fill separate day/month/year select fields', () => {
      // Setup select elements with options
      const daySelect = document.createElement('select');
      const monthSelect = document.createElement('select');
      const yearSelect = document.createElement('select');

      // Add day options (1-31)
      for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        const value = i.toString().padStart(2, '0');
        option.value = value;
        option.text = value;
        daySelect.appendChild(option);
      }

      // Add month options (1-12)
      for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        const value = i.toString().padStart(2, '0');
        option.value = value;
        option.text = value;
        monthSelect.appendChild(option);
      }

      // Add year options (1900-2024)
      for (let i = 1900; i <= 2024; i++) {
        const option = document.createElement('option');
        option.value = i.toString();
        option.text = i.toString();
        yearSelect.appendChild(option);
      }

      formFields.birthdateField = {
        single: null,
        format: 'dd/mm/yyyy',
        day: daySelect as unknown as HTMLInputElement,
        month: monthSelect as unknown as HTMLInputElement,
        year: yearSelect as unknown as HTMLInputElement
      };

      formFiller.fillFields(mockCredential);

      expect(daySelect.value).toBe('03');
      expect(monthSelect.value).toBe('02');
      expect(yearSelect.value).toBe('1991');
      expect(wasTriggerCalledFor(daySelect)).toBe(true);
      expect(wasTriggerCalledFor(monthSelect)).toBe(true);
      expect(wasTriggerCalledFor(yearSelect)).toBe(true);
    });
  });

  describe('fillGenderFields', () => {
    it('should fill gender select field', () => {
      const selectElement = document.createElement('select');

      // Add options using createElement
      const maleOption = document.createElement('option');
      maleOption.value = 'm';
      maleOption.text = 'Male';
      selectElement.add(maleOption);

      const femaleOption = document.createElement('option');
      femaleOption.value = 'f';
      femaleOption.text = 'Female';
      selectElement.add(femaleOption);

      formFields.genderField = {
        type: 'select',
        field: selectElement
      };

      formFiller.fillFields(mockCredential);

      expect(selectElement.value).toBe('m');
      expect(wasTriggerCalledFor(selectElement)).toBe(true);
    });

    it('should handle radio button gender fields', () => {
      const maleRadio = document.createElement('input');
      maleRadio.type = 'radio';
      const femaleRadio = document.createElement('input');
      femaleRadio.type = 'radio';

      formFields.genderField = {
        type: 'radio',
        field: null,
        radioButtons: {
          male: maleRadio,
          female: femaleRadio,
          other: null
        }
      };

      formFiller.fillFields(mockCredential);

      expect(maleRadio.checked).toBe(true);
      expect(femaleRadio.checked).toBe(false);
      expect(wasTriggerCalledFor(maleRadio)).toBe(true);
    });
  });
});