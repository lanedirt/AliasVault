import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormFiller } from '../FormFiller';
import { JSDOM } from 'jsdom';
import { setupTestDOM, createMockFormFields, createMockCredential, wasTriggerCalledFor, createDateSelects } from './TestUtils';
import { FormFields } from '../types/FormFields';
import { Credential } from '../../types/Credential';

const { window } = new JSDOM('<!DOCTYPE html>');
global.HTMLSelectElement = window.HTMLSelectElement;
global.HTMLInputElement = window.HTMLInputElement;

describe('FormFiller Dutch', () => {
  let mockTriggerInputEvents: ReturnType<typeof vi.fn>;
  let formFields: FormFields;
  let formFiller: FormFiller;
  let mockCredential: Credential;
  let document: Document;

  beforeEach(() => {
    const { document: doc } = setupTestDOM();
    document = doc;
    mockTriggerInputEvents = vi.fn();
    formFields = createMockFormFields(document);
    mockCredential = createMockCredential();
    formFiller = new FormFiller(formFields, mockTriggerInputEvents);
  });

  describe('fillBirthdateFields with Dutch month names', () => {
    it('should fill separate fields with Dutch month names', () => {
      const { daySelect, monthSelect, yearSelect } = createDateSelects(document);

      // Add month options with Dutch month names
      const months = [
        'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
        'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
      ];
      months.forEach((month, _) => {
        const option = document.createElement('option');
        option.value = month;
        option.text = month;
        monthSelect.appendChild(option);
      });

      formFields.birthdateField = {
        single: null,
        format: 'dd/mm/yyyy',
        day: daySelect as unknown as HTMLInputElement,
        month: monthSelect as unknown as HTMLInputElement,
        year: yearSelect as unknown as HTMLInputElement
      };

      formFiller.fillFields(mockCredential);

      expect(daySelect.value).toBe('03');
      expect(monthSelect.value).toBe('Februari');
      expect(yearSelect.value).toBe('1991');
      expect(wasTriggerCalledFor(mockTriggerInputEvents, daySelect)).toBe(true);
      expect(wasTriggerCalledFor(mockTriggerInputEvents, monthSelect)).toBe(true);
      expect(wasTriggerCalledFor(mockTriggerInputEvents, yearSelect)).toBe(true);
    });
  });
});