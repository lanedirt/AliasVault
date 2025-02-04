type LoginForm = {
  form: HTMLFormElement | null;
  emailField: HTMLInputElement | null;
  usernameField: HTMLInputElement | null;
  passwordField: HTMLInputElement | null;
  passwordConfirmField: HTMLInputElement | null;

  // Identity fields
  firstNameField: HTMLInputElement | null;
  lastNameField: HTMLInputElement | null;
  birthdateField: HTMLInputElement | null;
  genderField: HTMLInputElement | null;
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
      const emailField = this.findInputField(form, ['email'], ['email']);
      const usernameField = this.findUsernameField(passwordField);
      const passwordConfirmField = this.findPasswordConfirmField(passwordField);

      // Find identity fields
      const firstNameField = this.findInputField(form, ['firstname', 'first-name', 'fname', 'voornaam'], ['text']);
      const lastNameField = this.findInputField(form, ['lastname', 'last-name', 'lname', 'achternaam'], ['text']);
      const birthdateField = this.findInputField(form, ['birthdate', 'birth-date', 'dob', 'geboortedatum'], ['date', 'text']);
      const genderField = this.findInputField(form, ['gender', 'sex', 'geslacht'], ['text', 'select-one']);

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
      if (type === 'text' || type === 'email') {
        const attributes = [
          input.type,
          input.id,
          input.name,
          input.className,
          input.placeholder
        ].map(attr => attr?.toLowerCase() || '');

        const patterns = ['user', 'username', 'mail', 'email', 'login', 'identifier'];
        if (patterns.some(pattern => attributes.some(attr => attr.includes(pattern)))) {
          return input;
        }
      }
    }

    return null;
  }
}