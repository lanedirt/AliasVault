import { describe, it, expect } from 'vitest';
import { FormField, testField, testBirthdateFormat } from './TestUtils';

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
      testBirthdateFormat('dd-mm-yyyy', htmlFile);
      testField(FormField.GenderMale, 'gender1', htmlFile);
      testField(FormField.GenderFemale, 'gender2', htmlFile);
      testField(FormField.GenderOther, 'gender3', htmlFile);
    });

    describe('Dutch registration form 4 detection', () => {
      const htmlFile = 'nl-registration-form4.html';

      testField(FormField.Email, 'EmailAddress', htmlFile);
    });

    describe('Dutch registration form 5 detection', () => {
      const htmlFile = 'nl-registration-form5.html';

      testField(FormField.Email, 'input_25_5', htmlFile);
      testField(FormField.Gender, 'input_25_13', htmlFile);
      testField(FormField.FirstName, 'input_25_14', htmlFile);
      testField(FormField.LastName, 'input_25_15', htmlFile);
      testField(FormField.BirthDate, 'input_25_10', htmlFile);
      testBirthdateFormat('dd/mm/yyyy', htmlFile);
    });

    describe('Dutch registration form 6 detection', () => {
      const htmlFile = 'nl-registration-form6.html';

      testField(FormField.Email, 'field18478', htmlFile);
      testField(FormField.FirstName, 'field18479', htmlFile);
      testField(FormField.LastName, 'field18486', htmlFile);
    });

    describe('Dutch registration form 7 detection', () => {
      const htmlFile = 'nl-registration-form7.html';

      testField(FormField.Email, 'Form_EmailAddress', htmlFile);
      testField(FormField.Password, 'Form_Password', htmlFile);
      testField(FormField.PasswordConfirm, 'Form_RepeatPassword', htmlFile);
    });
});
