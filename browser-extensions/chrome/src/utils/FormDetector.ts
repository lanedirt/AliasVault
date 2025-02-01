type LoginForm = {
  form: HTMLFormElement | null;
  usernameField: HTMLInputElement | null;
  passwordField: HTMLInputElement | null;
}

/**
 * Detect login forms on the page.
 */
export function detectForms(): LoginForm[] {
  const forms: LoginForm[] = [];

  // Find all password fields
  const passwordFields = document.querySelectorAll<HTMLInputElement>('input[type="password"]');

  passwordFields.forEach(passwordField => {
    const form = passwordField.closest('form');
    const usernameField = findUsernameField(passwordField);

    forms.push({
      form,
      usernameField,
      passwordField
    });
  });

  return forms;
}

/**
 * Find the username field in the form containing the password field.
 */
function findUsernameField(passwordField: HTMLInputElement): HTMLInputElement | null {
  const form = passwordField.closest('form');
  const candidates = form ? form.querySelectorAll<HTMLInputElement>('input') : document.querySelectorAll<HTMLInputElement>('input');

  for (const input of Array.from(candidates)) {
    if (input === passwordField) continue;

    // Check input type
    const type = input.type.toLowerCase();
    if (type === 'text' || type === 'email') {
      // Check common username/email patterns
      const attributes = [
        input.type,
        input.id,
        input.name,
        input.className,
        input.placeholder
      ].map(attr => attr?.toLowerCase() || '');

      const patterns = ['user', 'email', 'login', 'identifier'];
      if (patterns.some(pattern => attributes.some(attr => attr.includes(pattern)))) {
        return input;
      }
    }
  }

  return null;
}