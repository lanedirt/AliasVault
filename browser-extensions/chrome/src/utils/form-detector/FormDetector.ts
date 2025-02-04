type LoginForm = {
  form: HTMLFormElement | null;
  emailField: HTMLInputElement | null;
  usernameField: HTMLInputElement | null;
  passwordField: HTMLInputElement | null;
  passwordConfirmField: HTMLInputElement | null;

  // Identity fields
  firstNameField: HTMLInputElement | null;
  lastNameField: HTMLInputElement | null;

  // Birthdate fields can be either a single field or multiple fields
  birthdateField: {
    single: HTMLInputElement | null;
    day: HTMLInputElement | null;
    month: HTMLInputElement | null;
    year: HTMLInputElement | null;
  };

  // Gender field can be either select, radio or text input
  genderField: {
    type: 'select' | 'radio' | 'text';
    field: HTMLInputElement | HTMLSelectElement | null;
    radioButtons?: {
      male: HTMLInputElement | null;
      female: HTMLInputElement | null;
      other: HTMLInputElement | null;
    };
  };
}

export class FormDetector {
  private document: Document;

  constructor(document: Document) {
    this.document = document;
  }

  /**
   * Detect login forms on the page.
   */
  public detectForms(): LoginForm[] {
    const forms: LoginForm[] = [];
    const passwordFields = this.document.querySelectorAll<HTMLInputElement>('input[type="password"]');

    passwordFields.forEach(passwordField => {
      const form = passwordField.closest('form');

      // Find all the required fields
      const emailField = this.findEmailField(passwordField);
      const usernameField = this.findUsernameField(passwordField);
      const passwordConfirmField = this.findPasswordConfirmField(passwordField);

      // Find identity fields
      const firstNameField = this.findInputField(form, ['firstname', 'first-name', 'fname', 'voornaam'], ['text']);
      const lastNameField = this.findInputField(form, ['lastname', 'last-name', 'lname', 'achternaam'], ['text']);
      const birthdateField = this.findBirthdateFields(form);
      const genderField = this.findGenderField(form);

      forms.push({
        form,
        emailField,
        usernameField,
        passwordField,
        passwordConfirmField,
        firstNameField,
        lastNameField,
        birthdateField,
        genderField
      });
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
  private findEmailField(passwordField: HTMLInputElement): HTMLInputElement | null {
    const form = passwordField.closest('form');
    const candidates = form
      ? form.querySelectorAll<HTMLInputElement>('input')
      : this.document.querySelectorAll<HTMLInputElement>('input');

    for (const input of Array.from(candidates)) {
      if (input === passwordField) continue;

      const type = input.type.toLowerCase();
      if (type === 'text' || type === 'email') {
        // Check input attributes
        const attributes = [
          input.type,
          input.id,
          input.name,
          input.className,
          input.placeholder
        ].map(attr => attr?.toLowerCase() || '');

        const patterns = ['email', 'e-mail', 'mail', 'address', '@'];

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

        if (patterns.some(pattern => attributes.some(attr => attr.includes(pattern)))) {
          return input;
        }
      }
    }

    return null;
  }

  private findBirthdateFields(form: HTMLFormElement | null): LoginForm['birthdateField'] {
    // First try to find a single date input
    const singleDateField = this.findInputField(form, ['birthdate', 'birth-date', 'dob', 'geboortedatum'], ['date', 'text']);

    if (singleDateField) {
      return {
        single: singleDateField,
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
      day: dayField,
      month: monthField,
      year: yearField
    };
  }

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
      const malePatterns = ['male', 'man', 'm', 'masculin', 'man'];
      const femalePatterns = ['female', 'woman', 'f', 'feminin', 'vrouw'];
      const otherPatterns = ['other', 'diverse', 'custom', 'prefer not', 'anders', 'iets'];

      const findRadioByPatterns = (patterns: string[]) => {
        return Array.from(radioButtons).find(radio => {
          const attributes = [
            radio.value,
            radio.id,
            radio.name,
            radio.labels?.[0]?.textContent || ''
          ].map(attr => attr?.toLowerCase() || '');

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
}