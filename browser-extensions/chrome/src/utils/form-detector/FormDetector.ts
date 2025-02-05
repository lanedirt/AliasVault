import { LoginForm } from "./types/LoginForm";

/**
 * Form detector.
 */
export class FormDetector {
  private document: Document;

  /**
   * Constructor.
   */
  public constructor(document: Document) {
    this.document = document;
  }

  /**
   * Detect login forms on the page.
   */
  public detectForms(): LoginForm[] {
    const forms: LoginForm[] = [];

    // Find all input fields that could be part of a login form
    const passwordFields = this.document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    const emailFields = this.document.querySelectorAll<HTMLInputElement>('input[type="email"], input[type="text"]');
    const textFields = this.document.querySelectorAll<HTMLInputElement>('input[type="text"]');

    // Create a Set to track processed forms to avoid duplicates
    const processedForms = new Set<HTMLFormElement | null>();

    /**
     * Helper to create a form entry
     */
    const createFormEntry = (
      form: HTMLFormElement | null,
      usernameField: HTMLInputElement | null,
      passwordField: HTMLInputElement | null
    ) : void => {
      // Skip if we've already processed this form
      if (form && processedForms.has(form)) return;
      processedForms.add(form);

      // Find email fields
      const emailFields = this.findEmailField(form);

      // Find additional fields
      const passwordConfirmField = passwordField ? this.findPasswordConfirmField(passwordField) : null;
      const firstNameField = this.findInputField(form, ['firstname', 'first-name', 'fname', 'voornaam'], ['text']);
      const lastNameField = this.findInputField(form, ['lastname', 'last-name', 'lname', 'achternaam'], ['text']);
      const birthdateField = this.findBirthdateFields(form);
      const genderField = this.findGenderField(form);

      forms.push({
        form,
        emailField: emailFields.primary,
        emailConfirmField: emailFields.confirm,
        usernameField,
        passwordField,
        passwordConfirmField,
        firstNameField,
        lastNameField,
        birthdateField,
        genderField
      });
    };

    // Process password fields first
    passwordFields.forEach(passwordField => {
      const form = passwordField.closest('form');
      const usernameField = this.findUsernameField(passwordField);
      createFormEntry(form, usernameField, passwordField);
    });

    // Process email fields that aren't already part of a processed form
    emailFields.forEach(field => {
      const form = field.closest('form');
      if (form && processedForms.has(form)) return;

      if (this.isLikelyEmailField(field)) {
        const passwordField = form ?
          form.querySelector<HTMLInputElement>('input[type="password"]') : null;
        const usernameField = this.findUsernameField(field);
        createFormEntry(form, usernameField, passwordField);
      }
    });

    // Process potential username fields that aren't already part of a processed form
    textFields.forEach(field => {
      const form = field.closest('form');
      if (form && processedForms.has(form)) return;

      if (this.isLikelyUsernameField(field)) {
        const passwordField = form ?
          form.querySelector<HTMLInputElement>('input[type="password"]') : null;
        createFormEntry(form, field, passwordField);
      }
    });

    return forms;
  }

  /**
   * Find an input field based on common patterns in its attributes.
   */
  private findInputField(
    form: HTMLFormElement | null,
    patterns: string[],
    types: string[]
  ): HTMLInputElement | null {
    const candidates = form
      ? form.querySelectorAll<HTMLInputElement>('input, select')
      : this.document.querySelectorAll<HTMLInputElement>('input, select');

    for (const input of Array.from(candidates)) {
      const type = input.type.toLowerCase();
      if (!types.includes(type)) continue;

      const attributes = [
        input.type,
        input.id,
        input.name,
        input.className,
        input.placeholder
      ].map(attr => attr?.toLowerCase() || '');

      if (patterns.some(pattern => attributes.some(attr => attr.includes(pattern)))) {
        return input;
      }
    }

    return null;
  }

  /**
   * Find the password confirmation field that matches the password field.
   */
  private findPasswordConfirmField(passwordField: HTMLInputElement): HTMLInputElement | null {
    const form = passwordField.closest('form');
    const candidates = form
      ? form.querySelectorAll<HTMLInputElement>('input[type="password"]')
      : this.document.querySelectorAll<HTMLInputElement>('input[type="password"]');

    for (const input of Array.from(candidates)) {
      if (input === passwordField) continue;

      const attributes = [
        input.id,
        input.name,
        input.className,
        input.placeholder
      ].map(attr => attr?.toLowerCase() || '');

      const patterns = ['confirm', 'verification', 'repeat', 'retype', '2', 'verify'];
      if (patterns.some(pattern => attributes.some(attr => attr.includes(pattern)))) {
        return input;
      }
    }

    return null;
  }

  /**
   * Find the username field in the form containing the password field.
   */
  private findUsernameField(passwordField: HTMLInputElement): HTMLInputElement | null {
    const form = passwordField.closest('form');
    const candidates = form
      ? form.querySelectorAll<HTMLInputElement>('input')
      : this.document.querySelectorAll<HTMLInputElement>('input');

    for (const input of Array.from(candidates)) {
      if (input === passwordField) continue;

      const type = input.type.toLowerCase();
      if (type === 'text') {
        const attributes = [
          input.type,
          input.id,
          input.name,
          input.className,
          input.placeholder
        ].map(attr => attr?.toLowerCase() || '');

        const patterns = ['user', 'username', 'name', 'login', 'identifier'];
        if (patterns.some(pattern => attributes.some(attr => attr.includes(pattern)))) {
          return input;
        }
      }
    }

    return null;
  }

  /**
   * Find the email field in the form containing the password field.
   */
  private findEmailField(form: HTMLFormElement | null): {
    primary: HTMLInputElement | null,
    confirm: HTMLInputElement | null
  } {
    const candidates = form
      ? form.querySelectorAll<HTMLInputElement>('input')
      : this.document.querySelectorAll<HTMLInputElement>('input');

    let primaryEmail: HTMLInputElement | null = null;
    let confirmEmail: HTMLInputElement | null = null;

    // Helper function to check if an input is an email field
    /**
     *
     */
    const isEmailField = (input: HTMLInputElement, confirmPatterns: string[] = []): boolean => {
      const type = input.type.toLowerCase();
      if (type === 'text' || type === 'email') {
        const attributes = [
          input.type,
          input.id,
          input.name,
          input.className,
          input.placeholder
        ].map(attr => attr?.toLowerCase() || '');

        // Check parent div for email-related text
        const parentDiv = input.closest('div');
        if (parentDiv) {
          const parentText = parentDiv.textContent?.toLowerCase() || '';
          attributes.push(parentText);

          // Check for label elements within the parent div
          const labels = parentDiv.getElementsByTagName('label');
          for (const label of Array.from(labels)) {
            attributes.push(label.textContent?.toLowerCase() || '');
          }
        }

        const patterns = [...confirmPatterns, 'email', 'e-mail', 'mail', 'address', '@'];
        return patterns.some(pattern => attributes.some(attr => attr.includes(pattern)));
      }
      return false;
    };

    // First pass: find primary email
    for (const input of Array.from(candidates)) {
      if (!primaryEmail && isEmailField(input)) {
        primaryEmail = input;
        break;
      }
    }

    // Second pass: find confirmation email
    if (primaryEmail) {
      for (const input of Array.from(candidates)) {
        if (input !== primaryEmail &&
            isEmailField(input, ['confirm', 'verification', 'repeat', 'retype', 'verify'])) {
          confirmEmail = input;
          break;
        }
      }
    }

    return {
      primary: primaryEmail,
      confirm: confirmEmail
    };
  }

  /**
   *
   */
  private findBirthdateFields(form: HTMLFormElement | null): LoginForm['birthdateField'] {
    // First try to find a single date input
    const singleDateField = this.findInputField(form, ['birthdate', 'birth-date', 'dob', 'geboortedatum'], ['date', 'text']);

    // Detect date format by searching all text content in the form
    let format = 'yyyy-mm-dd'; // default format
    if (form && singleDateField) {
      // Get the parent container
      const container = singleDateField.closest('div');
      if (container) {
        // Collect text from all relevant elements
        const elements = [
          ...Array.from(container.getElementsByTagName('label')),
          ...Array.from(container.getElementsByTagName('span')),
          container
        ];

        const allText = elements
          .map(el => el.textContent?.toLowerCase() || '')
          .join(' ')
          // Normalize different types of spaces and separators
          .replace(/[\s\u00A0]/g, '')
          .replace(/[\/\-]/g, '');

        // Check for date format patterns
        if (/dd.*mm.*jj/i.test(allText) || /dd.*mm.*yyyy/i.test(allText)) {
          format = 'dd-mm-yyyy';
        } else if (/mm.*dd.*yyyy/i.test(allText)) {
          format = 'mm-dd-yyyy';
        } else if (/yyyy.*mm.*dd/i.test(allText)) {
          format = 'yyyy-mm-dd';
        }

        // Check placeholder as fallback
        if (format === 'yyyy-mm-dd' && singleDateField.placeholder) {
          const placeholder = singleDateField.placeholder.toLowerCase().replace(/[\s\u00A0\-\/]/g, '');
          if (/ddmm/.test(placeholder)) {
            format = 'dd-mm-yyyy';
          } else if (/mmdd/.test(placeholder)) {
            format = 'mm-dd-yyyy';
          }
        }
      }
    }

    if (singleDateField) {
      return {
        single: singleDateField,
        format,
        day: null,
        month: null,
        year: null
      };
    }

    // Look for separate day/month/year fields
    const dayField = this.findInputField(form, ['birth-day', 'birthday', 'day', 'dag'], ['text', 'number']);
    const monthField = this.findInputField(form, ['birth-month', 'birthmonth', 'month', 'maand'], ['text', 'number']);
    const yearField = this.findInputField(form, ['birth-year', 'birthyear', 'year', 'jaar'], ['text', 'number']);

    return {
      single: null,
      format: 'yyyy-mm-dd', // Default format for separate fields
      day: dayField,
      month: monthField,
      year: yearField
    };
  }

  /**
   *
   */
  private findGenderField(form: HTMLFormElement | null): LoginForm['genderField'] {
    // Try to find select element first
    const selectField = form
      ? form.querySelector<HTMLSelectElement>('select[name*="gender"], select[name*="sex"], select[id*="gender"], select[id*="sex"]')
      : null;

    if (selectField) {
      return {
        type: 'select',
        field: selectField
      };
    }

    // Try to find radio buttons
    const radioButtons = form
      ? form.querySelectorAll<HTMLInputElement>('input[type="radio"][name*="gender"], input[type="radio"][name*="sex"]')
      : null;

    if (radioButtons && radioButtons.length > 0) {
      // Map specific gender radio buttons
      const malePatterns = ['male', 'man', 'm', 'man', 'gender1'];
      const femalePatterns = ['female', 'woman', 'f', 'vrouw', 'gender2'];
      const otherPatterns = ['other', 'diverse', 'custom', 'prefer not', 'anders', 'iets', 'unknown', 'gender3'];

      /**
       *
       */
      const findRadioByPatterns = (patterns: string[], isOther: boolean = false) : HTMLInputElement | null => {
        return Array.from(radioButtons).find(radio => {
          const attributes = [
            radio.value,
            radio.id,
            radio.name,
            radio.labels?.[0]?.textContent || ''
          ].map(attr => attr?.toLowerCase() || '');

          // For "other" patterns, skip if it matches male or female patterns
          if (isOther && (
            malePatterns.some(pattern => attributes.some(attr => attr.includes(pattern))) ||
            femalePatterns.some(pattern => attributes.some(attr => attr.includes(pattern)))
          )) {
            return false;
          }

          return patterns.some(pattern =>
            attributes.some(attr => attr.includes(pattern))
          );
        }) || null;
      };

      return {
        type: 'radio',
        field: null, // Set to null since we're providing specific mappings
        radioButtons: {
          male: findRadioByPatterns(malePatterns),
          female: findRadioByPatterns(femalePatterns),
          other: findRadioByPatterns(otherPatterns)
        }
      };
    }

    // Fall back to regular text input
    const textField = this.findInputField(form, ['gender', 'sex', 'geslacht'], ['text']);

    return {
      type: 'text',
      field: textField
    };
  }

  /**
   * Check if a field is likely an email field based on its attributes
   */
  private isLikelyEmailField(input: HTMLInputElement): boolean {
    const attributes = [
      input.type,
      input.id,
      input.name,
      input.className,
      input.placeholder
    ].map(attr => attr?.toLowerCase() || '');

    const patterns = ['email', 'e-mail', 'mail', 'address', '@'];
    return patterns.some(pattern => attributes.some(attr => attr.includes(pattern)));
  }

  /**
   * Check if a field is likely a username field based on its attributes
   */
  private isLikelyUsernameField(input: HTMLInputElement): boolean {
    const attributes = [
      input.type,
      input.id,
      input.name,
      input.className,
      input.placeholder
    ].map(attr => attr?.toLowerCase() || '');

    const patterns = ['user', 'username', 'login', 'identifier'];
    return patterns.some(pattern => attributes.some(attr => attr.includes(pattern)));
  }
}