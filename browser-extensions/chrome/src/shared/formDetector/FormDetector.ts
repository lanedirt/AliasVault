import { LoginForm } from "./types/LoginForm";
import { CombinedFieldPatterns, CombinedGenderOptionPatterns } from "./FieldPatterns";

/**
 * Form detector.
 */
export class FormDetector {
  private readonly document: Document;
  private readonly clickedElement: HTMLElement | null;
  private readonly processedForms = new Set<HTMLFormElement | null>();
  private readonly forms: LoginForm[] = [];

  /**
   * Constructor.
   */
  public constructor(document: Document, clickedElement?: HTMLElement) {
    this.document = document;
    this.clickedElement = clickedElement ?? null;
  }

  /**
   * Detect login forms on the page based on the clicked element.
   *
   * @param force - Force the detection of forms, skipping checks such as if the element contains autocomplete="off".
   */
  public detectForms(force: boolean = false): LoginForm[] {
    if (this.clickedElement) {
      const formWrapper = this.clickedElement.closest('form') ?? this.document.body;

      // Check if the wrapper contains a password or likely username field before processing.
      if (this.containsPasswordField(formWrapper) || this.containsLikelyUsernameOrEmailField(formWrapper, force)) {
        this.createFormEntry(formWrapper);
      }
    }

    return this.forms;
  }

  /**
   * Find an input field based on common patterns in its attributes.
   */
  private findInputField(
    form: HTMLFormElement | null,
    patterns: string[],
    types: string[],
    excludeElements: HTMLInputElement[] = []
  ): HTMLInputElement | null {
    const candidates = form
      ? form.querySelectorAll<HTMLInputElement>('input, select')
      : this.document.querySelectorAll<HTMLInputElement>('input, select');

    // Track best match and its pattern index
    let bestMatch: HTMLInputElement | null = null;
    let bestMatchIndex = patterns.length;

    for (const input of Array.from(candidates)) {
      // Skip if this element is already used
      if (excludeElements.includes(input)) continue;

      // Handle both input and select elements
      const type = input.tagName.toLowerCase() === 'select' ? 'select' : input.type.toLowerCase();
      if (!types.includes(type)) continue;

      // Collect all text attributes to check
      const attributes = [
        input.id,
        input.name,
        input.placeholder
      ].map(attr => attr?.toLowerCase() ?? '');

      // Check for associated labels if input has an ID or name
      if (input.id || input.name) {
        const label = this.document.querySelector(`label[for="${input.id || input.name}"]`);
        if (label) {
          attributes.push(label.textContent?.toLowerCase() ?? '');
        }
      }

      // Check for parent label
      let currentElement = input;
      for (let i = 0; i < 3; i++) {
        const parentLabel = currentElement.closest('label');
        if (parentLabel) {
          attributes.push(parentLabel.textContent?.toLowerCase() ?? '');
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
   * Find the email field in the form.
   */
  private findEmailField(form: HTMLFormElement | null): {
    primary: HTMLInputElement | null,
    confirm: HTMLInputElement | null
  } {
    // Find primary email field
    const primaryEmail = this.findInputField(
      form,
      CombinedFieldPatterns.email,
      ['text', 'email']
    );

    // Find confirmation email field if primary exists
    const confirmEmail = primaryEmail
      ? this.findInputField(
        form,
        CombinedFieldPatterns.emailConfirm,
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
  private findBirthdateFields(form: HTMLFormElement | null, excludeElements: HTMLInputElement[] = []): LoginForm['birthdateField'] {
    // First try to find a single date input
    const singleDateField = this.findInputField(form, CombinedFieldPatterns.birthdate, ['date', 'text'], excludeElements);

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
          .map(el => el.textContent?.toLowerCase() ?? '')
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
    const dayField = this.findInputField(form, CombinedFieldPatterns.birthDateDay, ['text', 'number', 'select'], excludeElements);
    const monthField = this.findInputField(form, CombinedFieldPatterns.birthDateMonth, ['text', 'number', 'select'], excludeElements);
    const yearField = this.findInputField(form, CombinedFieldPatterns.birthDateYear, ['text', 'number', 'select'], excludeElements);

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
  private findGenderField(form: HTMLFormElement | null, excludeElements: HTMLInputElement[] = []): LoginForm['genderField'] {
    // Try to find select or input element using the shared method
    const genderField = this.findInputField(
      form,
      CombinedFieldPatterns.gender,
      ['select'],
      excludeElements
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
      /**
       * Find a radio button by patterns.
       */
      const findRadioByPatterns = (patterns: string[], isOther: boolean = false) : HTMLInputElement | null => {
        return Array.from(radioButtons).find(radio => {
          const attributes = [
            radio.value,
            radio.id,
            radio.name,
            radio.labels?.[0]?.textContent ?? ''
          ].map(attr => attr?.toLowerCase() ?? '');

          // For "other" patterns, skip if it matches male or female patterns
          if (isOther && (
            CombinedGenderOptionPatterns.male.some(pattern => attributes.some(attr => attr.includes(pattern))) ||
            CombinedGenderOptionPatterns.female.some(pattern => attributes.some(attr => attr.includes(pattern)))
          )) {
            return false;
          }

          return patterns.some(pattern =>
            attributes.some(attr => attr.includes(pattern))
          );
        }) ?? null;
      };

      return {
        type: 'radio',
        field: null, // Set to null since we're providing specific mappings
        radioButtons: {
          male: findRadioByPatterns(CombinedGenderOptionPatterns.male),
          female: findRadioByPatterns(CombinedGenderOptionPatterns.female),
          other: findRadioByPatterns(CombinedGenderOptionPatterns.other)
        }
      };
    }

    // Fall back to regular text input
    const textField = this.findInputField(form, CombinedFieldPatterns.gender, ['text'], excludeElements);

    return {
      type: 'text',
      field: textField
    };
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

    const candidateArray = Array.from(candidates);

    return {
      primary: candidateArray[0] ?? null,
      confirm: candidateArray[1] ?? null
    };
  }

  /**
   * Check if a form contains a password field.
   */
  private containsPasswordField(wrapper: HTMLElement): boolean {
    const passwordFields = this.findPasswordField(wrapper as HTMLFormElement | null);
    if (passwordFields.primary) {
      return true;
    }

    return false;
  }

  /**
   * Check if a form contains a likely username or email field.
   */
  private containsLikelyUsernameOrEmailField(wrapper: HTMLElement, force: boolean = false): boolean {
    // Check if the form contains an email field.
    const emailFields = this.findEmailField(wrapper as HTMLFormElement | null);
    if (emailFields.primary) {
      const isValid = force || emailFields.primary.getAttribute('autocomplete') !== 'off';
      if (isValid) {
        return true;
      }
    }

    // Check if the form contains a username field.
    const usernameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.username, ['text'], []);

    // Check if the form contains name fields.
    const firstNameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.firstName, ['text'], []);
    const lastNameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.lastName, ['text'], []);

    // Get the first field that is not null.
    const field = usernameField ?? firstNameField ?? lastNameField;
    if (field) {
      // Check if the field is valid by checking if the autocomplete attribute is not set to off (which would indicate that the website considers this field not meant to be autofilled)
      const isValid = force || field?.getAttribute('autocomplete') !== 'off';
      if (isValid) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create a form entry.
   */
  private createFormEntry(wrapper: HTMLElement | null): void {
    // Skip if we've already processed this form
    if (wrapper && this.processedForms.has(wrapper as HTMLFormElement)) return;
    this.processedForms.add(wrapper as HTMLFormElement);

    // Keep track of detected fields to prevent overlap
    const detectedFields: HTMLInputElement[] = [];

    // Find fields in priority order (most specific to least specific).
    const emailFields = this.findEmailField(wrapper as HTMLFormElement | null);
    if (emailFields.primary) detectedFields.push(emailFields.primary);
    if (emailFields.confirm) detectedFields.push(emailFields.confirm);

    const passwordFields = this.findPasswordField(wrapper as HTMLFormElement | null);
    if (passwordFields.primary) detectedFields.push(passwordFields.primary);
    if (passwordFields.confirm) detectedFields.push(passwordFields.confirm);

    const usernameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.username, ['text'], detectedFields);
    if (usernameField) detectedFields.push(usernameField);

    const firstNameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.firstName, ['text'], detectedFields);
    if (firstNameField) detectedFields.push(firstNameField);

    const lastNameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.lastName, ['text'], detectedFields);
    if (lastNameField) detectedFields.push(lastNameField);

    const birthdateField = this.findBirthdateFields(wrapper as HTMLFormElement | null, detectedFields);
    if (birthdateField.single) detectedFields.push(birthdateField.single);
    if (birthdateField.day) detectedFields.push(birthdateField.day);
    if (birthdateField.month) detectedFields.push(birthdateField.month);
    if (birthdateField.year) detectedFields.push(birthdateField.year);

    const genderField = this.findGenderField(wrapper as HTMLFormElement | null, detectedFields);
    if (genderField.field) detectedFields.push(genderField.field as HTMLInputElement);

    this.forms.push({
      form: wrapper as HTMLFormElement,
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
  }
}
