import { FormDetector } from '../FormDetector';
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Helper function to load HTML test files
const loadTestHtml = (filename: string): string => {
  return readFileSync(join(__dirname, 'test-forms', filename), 'utf-8');
};

// Helper function to setup form detection test
const setupFormTest = (htmlFile: string) => {
  const html = loadTestHtml(htmlFile);
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    runScripts: 'dangerously',
    resources: 'usable'
  });
  const document = dom.window.document;
  const formDetector = new FormDetector(document);
  const result = formDetector.detectForms()[0];
  return { document, result };
};

enum FormField {
  Username = 'username',
  FirstName = 'firstName',
  LastName = 'lastName',
  Email = 'email',
  EmailConfirm = 'emailConfirm',
  Password = 'password',
  PasswordConfirm = 'passwordConfirm',
  BirthDate = 'birthdate',
  BirthDay = 'birthdateDay',
  BirthMonth = 'birthdateMonth',
  BirthYear = 'birthdateYear',
  Gender = 'gender',
  GenderMale = 'genderMale',
  GenderFemale = 'genderFemale',
  GenderOther = 'genderOther'
}

// Helper function to test field detection
const testField = (fieldName: FormField, elementId: string, htmlFile: string) => {
  it(`should detect ${fieldName} field`, () => {
    const { document, result } = setupFormTest(htmlFile);

    // First verify the test element exists
    const expectedElement = document.getElementById(elementId);
    if (!expectedElement) {
      throw new Error(`Test setup failed: Element with id "${elementId}" not found in test HTML. Check if the element is present in the test HTML file: ${htmlFile}`);
    }

    // Handle birthdate fields differently
    if (fieldName === FormField.BirthDate) {
      expect(result.birthdateField.single).toBe(expectedElement);
    } else if (fieldName === FormField.BirthDay) {
      expect(result.birthdateField.day).toBe(expectedElement);
    } else if (fieldName === FormField.BirthMonth) {
      expect(result.birthdateField.month).toBe(expectedElement);
    } else if (fieldName === FormField.BirthYear) {
      expect(result.birthdateField.year).toBe(expectedElement);
    }
    // Handle gender field differently
    else if (fieldName === FormField.Gender) {
      expect(result.genderField.field).toBe(expectedElement);
    } else if (fieldName === FormField.GenderMale) {
      expect(result.genderField.radioButtons?.male).toBe(expectedElement);
    } else if (fieldName === FormField.GenderFemale) {
      expect(result.genderField.radioButtons?.female).toBe(expectedElement);
    } else if (fieldName === FormField.GenderOther) {
      expect(result.genderField.radioButtons?.other).toBe(expectedElement);
    }
    // Handle default fields
    else {
      const fieldKey = `${fieldName}Field` as keyof typeof result;
      expect(result[fieldKey]).toBeDefined();
      expect(result[fieldKey]).toBe(expectedElement);
    }
  });
};

describe('FormDetector', () => {
  describe('Dutch registration form detection', () => {
    const htmlFile = 'nl-registration-form1.html';

    testField(FormField.LastName, 'cpContent_txtAchternaam', htmlFile);
    testField(FormField.Email, 'cpContent_txtEmail', htmlFile);
    testField(FormField.Password, 'cpContent_txtWachtwoord', htmlFile);
    testField(FormField.PasswordConfirm, 'cpContent_txtWachtwoord2', htmlFile);
  });

  describe('Dutch registration form 2 detection', () => {
    const htmlFile = 'nl-registration-form2.html';

    testField(FormField.Username, 'register-username', htmlFile);
    testField(FormField.Email, 'register-email', htmlFile);
    testField(FormField.Password, 'register-password', htmlFile);

    testField(FormField.BirthDay, 'register-day', htmlFile);
    testField(FormField.BirthMonth, 'register-month', htmlFile);
    testField(FormField.BirthYear, 'register-year', htmlFile);

    testField(FormField.GenderMale, 'man', htmlFile);
    testField(FormField.GenderFemale, 'vrouw', htmlFile);
    testField(FormField.GenderOther, 'iets', htmlFile);
  });

  describe('Dutch registration form 3 detection', () => {
    const htmlFile = 'nl-registration-form3.html';

    testField(FormField.FirstName, 'firstName', htmlFile);
    testField(FormField.LastName, 'lastName', htmlFile);
    testField(FormField.Password, 'password', htmlFile);

    testField(FormField.BirthDate, 'date', htmlFile);

    testField(FormField.GenderMale, 'gender1', htmlFile);
    testField(FormField.GenderFemale, 'gender2', htmlFile);
    testField(FormField.GenderOther, 'gender3', htmlFile);
  });

  describe('English registration form 1 detection', () => {
    const htmlFile = 'en-registration-form1.html';

    testField(FormField.Email, 'login', htmlFile);
    testField(FormField.Password, 'password', htmlFile);
  });

  describe('English registration form 2 detection', () => {
    const htmlFile = 'en-registration-form2.html';

    testField(FormField.Email, 'signup-email-input', htmlFile);
    testField(FormField.Username, 'signup-name-input', htmlFile);
  });

  describe('English registration form 3 detection', () => {
    const htmlFile = 'en-registration-form3.html';

    testField(FormField.Email, 'email', htmlFile);
    testField(FormField.EmailConfirm, 'reenter_email', htmlFile);
  });

  describe('English email form 1 detection', () => {
    const htmlFile = 'en-email-form1.html';

    testField(FormField.Email, 'P0-0', htmlFile);
  });
});