import { LoginForm } from "./types/LoginForm";

/**
 * Form detector.
 */
export class FormDetector {
  private document: Document;
  private clickedElement: HTMLElement | null;

  /**
   * Constructor.
   */
  public constructor(document: Document, clickedElement?: HTMLElement) {
    this.document = document;
    this.clickedElement = clickedElement || null;
  }

  /**
   * Detect login forms on the page, prioritizing the form containing the clicked element.
   */
  public detectForms(): LoginForm[] {
    const forms: LoginForm[] = [];

    // Create a Set to track processed forms to avoid duplicates
    const processedForms = new Set<HTMLFormElement | null>();

    /**
     * Helper to create a form entry
     */
    const createFormEntry = (form: HTMLFormElement | null): void => {
      // Skip if we've already processed this form
      if (form && processedForms.has(form)) return;
      processedForms.add(form);

      // Find all relevant fields
      const emailFields = this.findEmailField(form);
      const usernameField = this.findUsernameField(form);
      const passwordFields = this.findPasswordField(form);
      const firstNameField = this.findInputField(form, ['firstname', 'first-name', 'fname', 'voornaam', 'name'], ['text']);
      const lastNameField = this.findInputField(form, ['lastname', 'last-name', 'lname', 'achternaam'], ['text']);
      const birthdateField = this.findBirthdateFields(form);
      const genderField = this.findGenderField(form);

      forms.push({
        form,
        emailField: emailFields.primary,
        emailConfirmField: emailFields.confirm,
        usernameField,
        passwordField: passwordFields.primary,
        passwordConfirmField: passwordFields.confirm,
        firstNameField,
        lastNameField,
        birthdateField,
        genderField
      });
    };

    // If we have a clicked element, try to find its form first
    if (this.clickedElement) {
      const formWrapper = this.clickedElement.closest('form');

      if (formWrapper) {
        createFormEntry(formWrapper);

        // If we found a valid form, return early
        if (forms.length > 0) {
          return forms;
        }
      }
    }

    // Find all input fields that could be part of a login form
    const passwordFields = this.document.querySelectorAll<HTMLInputElement>('input[type="password"]');
    const emailFields = this.document.querySelectorAll<HTMLInputElement>('input[type="email"], input[type="text"]');
    const textFields = this.document.querySelectorAll<HTMLInputElement>('input[type="text"]');

    // Process password fields first
    passwordFields.forEach(passwordField => {
      const form = passwordField.closest('form');
      createFormEntry(form);
    });

    // Process email fields that aren't already part of a processed form
    emailFields.forEach(field => {
      const form = field.closest('form');
      if (form && processedForms.has(form)) return;

      if (this.isLikelyEmailField(field)) {
        createFormEntry(form);
      }
    });

    // Process potential username fields that aren't already part of a processed form
    textFields.forEach(field => {
      const form = field.closest('form');
      if (form && processedForms.has(form)) return;

      if (this.isLikelyUsernameField(field)) {
        createFormEntry(form);
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

    // Track best match and its pattern index
    let bestMatch: HTMLInputElement | null = null;
    let bestMatchIndex = patterns.length;

    for (const input of Array.from(candidates)) {
      // Handle both input and select elements
      const type = input.tagName.toLowerCase() === 'select' ? 'select' : input.type.toLowerCase();
      if (!types.includes(type)) continue;

      // Collect all text attributes to check
      const attributes = [
        input.id,
        input.name,
        input.placeholder
      ].map(attr => attr?.toLowerCase() || '');

      // Check for associated labels if input has an ID or name
      if (input.id || input.name) {
        const label = this.document.querySelector(`label[for="${input.id || input.name}"]`);
        if (label) {
          attributes.push(label.textContent?.toLowerCase() || '');
        }
      }

      // Check for parent label
      let currentElement = input;
      for (let i = 0; i < 3; i++) {
        const parentLabel = currentElement.closest('label');
        if (parentLabel) {
          attributes.push(parentLabel.textContent?.toLowerCase() || '');
          break;
        }

        if (currentElement.parentElement) {
          currentElement = currentElement.parentElement as HTMLInputElement;
        } else {
          break;
        }
      }

      // Find the earliest matching pattern
      for (let i = 0; i < patterns.length; i++) {
        if (i >= bestMatchIndex) break; // Skip if we already have a better match
        if (attributes.some(attr => attr.includes(patterns[i]))) {
          bestMatch = input;
          bestMatchIndex = i;
          break; // Found the best possible match for this input
        }
      }
    }

    return bestMatch;
  }

  /**
   * Find the username field in the form containing the password field.
   */
  private findUsernameField(form: HTMLFormElement | null): HTMLInputElement | null {
    const candidates = form
      ? form.querySelectorAll<HTMLInputElement>('input')
      : this.document.querySelectorAll<HTMLInputElement>('input');

    for (const input of Array.from(candidates)) {
      const type = input.type.toLowerCase();
      if (type === 'text') {
        const attributes = [
          input.type,
          input.id,
          input.name,
          input.className,
          input.placeholder
        ].map(attr => attr?.toLowerCase() || '');

        const patterns = ['user', 'username', 'login', 'identifier'];
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
    // Find primary email field
    const primaryEmail = this.findInputField(
      form,
      ['e-mailadres', 'e-mail', 'email', 'mail', '@', 'emailaddress'],
      ['text', 'email']
    );

    // Find confirmation email field if primary exists
    const confirmEmail = primaryEmail
      ? this.findInputField(
        form,
        ['confirm', 'verification', 'repeat', 'retype', 'verify'],
        ['text', 'email']
      )
      : null;

    return {
      primary: primaryEmail,
      confirm: confirmEmail
    };
  }

  /**
   * Find the birthdate fields in the form.
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
          // Don't replace separators yet to detect the preferred one
          .toLowerCase();

        // Check for date format patterns with either slash or dash
        if (/dd[-/]mm[-/]jj/i.test(allText) || /dd[-/]mm[-/]yyyy/i.test(allText)) {
          // Determine separator style from the matched pattern
          format = allText.includes('/') ? 'dd/mm/yyyy' : 'dd-mm-yyyy';
        } else if (/mm[-/]dd[-/]yyyy/i.test(allText)) {
          format = allText.includes('/') ? 'mm/dd/yyyy' : 'mm-dd-yyyy';
        } else if (/yyyy[-/]mm[-/]dd/i.test(allText)) {
          format = allText.includes('/') ? 'yyyy/mm/dd' : 'yyyy-mm-dd';
        }

        // Check placeholder as fallback
        if (format === 'yyyy-mm-dd' && singleDateField.placeholder) {
          const placeholder = singleDateField.placeholder.toLowerCase();
          if (/dd[-/]mm/i.test(placeholder)) {
            format = placeholder.includes('/') ? 'dd/mm/yyyy' : 'dd-mm-yyyy';
          } else if (/mm[-/]dd/i.test(placeholder)) {
            format = placeholder.includes('/') ? 'mm/dd/yyyy' : 'mm-dd-yyyy';
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
    const dayField = this.findInputField(form, ['birth-day', 'birthday', 'day', 'dag', 'birthdate_d'], ['text', 'number', 'select']);
    const monthField = this.findInputField(form, ['birth-month', 'birthmonth', 'month', 'maand', 'birthdate_m'], ['text', 'number', 'select']);
    const yearField = this.findInputField(form, ['birth-year', 'birthyear', 'year', 'jaar', 'birthdate_y'], ['text', 'number', 'select']);

    return {
      single: null,
      format: 'yyyy-mm-dd', // Default format for separate fields
      day: dayField,
      month: monthField,
      year: yearField
    };
  }

  /**
   * Find the gender field in the form.
   */
  private findGenderField(form: HTMLFormElement | null): LoginForm['genderField'] {
    // Try to find select or input element using the shared method
    const genderField = this.findInputField(
      form,
      ['gender', 'sex', 'geslacht', 'aanhef'],
      ['select']
    );

    if (genderField?.tagName.toLowerCase() === 'select') {
      return {
        type: 'select',
        field: genderField
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
       * Find a radio button by patterns.
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
    const textField = this.findInputField(form, ['gender', 'sex', 'geslacht', 'aanhef'], ['text']);

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

  /**
   * Find the password field in a form.
   */
  private findPasswordField(form: HTMLFormElement | null): {
    primary: HTMLInputElement | null,
    confirm: HTMLInputElement | null
  } {
    const candidates = form
      ? form.querySelectorAll<HTMLInputElement>('input[type="password"]')
      : this.document.querySelectorAll<HTMLInputElement>('input[type="password"]');

    let primaryPassword: HTMLInputElement | null = null;
    let confirmPassword: HTMLInputElement | null = null;

    // Look for the first password field that doesn't appear to be a confirmation field
    for (const input of Array.from(candidates)) {
      const attributes = [
        input.id,
        input.name,
        input.placeholder
      ].map(attr => attr?.toLowerCase() || '');

      const confirmPatterns = ['confirm', 'verification', 'repeat', 'retype', '2', 'verify'];
      if (!confirmPatterns.some(pattern => attributes.some(attr => attr.includes(pattern)))) {
        primaryPassword = input;
        break;
      }
    }

    // If no clear primary password field is found, use the first password field as primary
    if (!primaryPassword && candidates.length > 0) {
      primaryPassword = candidates[0];
    }

    // If we found a primary password, look for a confirmation field
    if (primaryPassword) {
      for (const input of Array.from(candidates)) {
        if (input === primaryPassword) continue;

        const attributes = [
          input.id,
          input.name,
          input.className,
          input.placeholder
        ].map(attr => attr?.toLowerCase() || '');

        const confirmPatterns = ['confirm', 'verification', 'repeat', 'retype', '2', 'verify'];
        if (confirmPatterns.some(pattern => attributes.some(attr => attr.includes(pattern)))) {
          confirmPassword = input;
          break;
        }
      }
    }

    return {
      primary: primaryPassword,
      confirm: confirmPassword
    };
  }
}
