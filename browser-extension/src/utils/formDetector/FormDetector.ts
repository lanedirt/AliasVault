import { FormFields } from "./types/FormFields";
import { CombinedFieldPatterns, CombinedGenderOptionPatterns } from "./FieldPatterns";

/**
 * Form detector.
 */
export class FormDetector {
  private readonly document: Document;
  private readonly clickedElement: HTMLElement | null;
  private readonly visibilityCache: Map<HTMLElement, boolean>;

  /**
   * Constructor.
   */
  public constructor(document: Document, clickedElement?: HTMLElement) {
    this.document = document;
    this.clickedElement = clickedElement ?? null;
    this.visibilityCache = new Map();
  }

  /**
   * Check if an element and all its parents are visible.
   * This checks for display:none, visibility:hidden, and opacity:0
   * Uses a cache to avoid redundant checks of the same elements.
   */
  private isElementVisible(element: HTMLElement | null): boolean {
    if (!element) {
      return false;
    }

    // Check cache first
    if (this.visibilityCache.has(element)) {
      return this.visibilityCache.get(element)!;
    }

    let current: HTMLElement | null = element;
    while (current) {
      try {
        const style = this.document.defaultView?.getComputedStyle(current);
        if (!style) {
          // Cache and return true for this element and all its parents
          let parent: HTMLElement | null = current;
          while (parent) {
            this.visibilityCache.set(parent, true);
            parent = parent.parentElement;
          }
          return true;
        }
        
        // Check for display:none
        if (style.display === 'none') {
          // Cache and return false for this element and all its parents
          let parent: HTMLElement | null = current;
          while (parent) {
            this.visibilityCache.set(parent, false);
            parent = parent.parentElement;
          }
          return false;
        }
        
        // Check for visibility:hidden
        if (style.visibility === 'hidden') {
          // Cache and return false for this element and all its parents
          let parent: HTMLElement | null = current;
          while (parent) {
            this.visibilityCache.set(parent, false);
            parent = parent.parentElement;
          }
          return false;
        }
        
        // Check for opacity:0
        if (parseFloat(style.opacity) === 0) {
          // Cache and return false for this element and all its parents
          let parent: HTMLElement | null = current;
          while (parent) {
            this.visibilityCache.set(parent, false);
            parent = parent.parentElement;
          }
          return false;
        }
      } catch {
        // If we can't get computed style, cache and return true for this element and all its parents
        let parent: HTMLElement | null = current;
        while (parent) {
          this.visibilityCache.set(parent, true);
          parent = parent.parentElement;
        }
        return true;
      }

      current = current.parentElement;
    }

    // Cache and return true for the original element
    this.visibilityCache.set(element, true);
    return true;
  }

  /**
   * Detect login forms on the page based on the clicked element.
   *
   * @param force - Force the detection of forms, skipping checks such as if the element contains autocomplete="off".
   */
  public containsLoginForm(force: boolean = false): boolean {
    if (this.clickedElement) {
      const formWrapper = this.clickedElement.closest('form') ?? this.document.body;

      /**
       * Sanity check: if form contains more than 150 inputs, don't process as this is likely not a login form.
       * This is a simple way to prevent processing large forms that are not login forms and making the browser page unresponsive.
       */
      const inputCount = formWrapper.querySelectorAll('input').length;
      if (inputCount > 200) {
        return false;
      }

      // Check if the wrapper contains a password or likely username field before processing.
      if (this.containsPasswordField(formWrapper) || this.containsLikelyUsernameOrEmailField(formWrapper, force)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect login forms on the page based on the clicked element.
   *
   * @param force - Force the detection of forms, skipping checks such as if the element contains autocomplete="off".
   */
  public getForm(): FormFields | null {
    if (!this.clickedElement) {
      return null;
    }

    const formWrapper = this.clickedElement.closest('form') ?? this.document.body;
    return this.detectFormFields(formWrapper);
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
      if (excludeElements.includes(input)) {
        continue;
      }

      // Skip if element is not visible
      if (!this.isElementVisible(input)) {
        continue;
      }

      // Handle both input and select elements
      const type = input.tagName.toLowerCase() === 'select' ? 'select' : input.type.toLowerCase();
      if (!types.includes(type)) {
        continue;
      }

      // Check for exact type match if types contains email, as that most likely is the email field.
      if (types.includes('email') && input.type.toLowerCase() === 'email') {
        return input;
      }

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

      // Check for parent label and table cell structure
      let currentElement = input;
      for (let i = 0; i < 3; i++) {
        // Check for parent label
        const parentLabel = currentElement.closest('label');
        if (parentLabel) {
          attributes.push(parentLabel.textContent?.toLowerCase() ?? '');
          break;
        }

        // Check for table cell structure
        const parentTd = currentElement.closest('td');
        if (parentTd) {
          // Get the parent row
          const parentTr = parentTd.closest('tr');
          if (parentTr) {
            // Check all sibling cells in the row
            const siblingTds = parentTr.querySelectorAll('td');
            for (const td of siblingTds) {
              if (td !== parentTd) { // Skip the cell containing the input
                attributes.push(td.textContent?.toLowerCase() ?? '');
              }
            }
          }
          break; // Found table structure, no need to continue up the tree
        }

        if (currentElement.parentElement) {
          currentElement = currentElement.parentElement as HTMLInputElement;
        } else {
          break;
        }
      }

      // Find the earliest matching pattern
      for (let i = 0; i < patterns.length; i++) {
        if (i >= bestMatchIndex) {
          break;
        } // Skip if we already have a better match
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
  private findBirthdateFields(form: HTMLFormElement | null, excludeElements: HTMLInputElement[] = []): FormFields['birthdateField'] {
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
  private findGenderField(form: HTMLFormElement | null, excludeElements: HTMLInputElement[] = []): FormFields['genderField'] {
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

    const visibleCandidates = Array.from(candidates).filter(input => this.isElementVisible(input));

    return {
      primary: visibleCandidates[0] ?? null,
      confirm: visibleCandidates[1] ?? null
    };
  }

  /**
   * Check if a form contains a password field.
   */
  private containsPasswordField(wrapper: HTMLElement): boolean {
    const passwordFields = this.findPasswordField(wrapper as HTMLFormElement | null);
    if (passwordFields.primary && this.isElementVisible(passwordFields.primary)) {
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
    if (emailFields.primary && this.isElementVisible(emailFields.primary)) {
      const isValid = force || emailFields.primary.getAttribute('autocomplete') !== 'off';
      if (isValid) {
        return true;
      }
    }

    // Check if the form contains a username field.
    const usernameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.username, ['text'], []);
    if (usernameField && this.isElementVisible(usernameField)) {
      const isValid = force || usernameField.getAttribute('autocomplete') !== 'off';
      if (isValid) {
        return true;
      }
    }

    // Check if the form contains a first name field.
    const firstNameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.firstName, ['text'], []);
    if (firstNameField && this.isElementVisible(firstNameField)) {
      const isValid = force || firstNameField.getAttribute('autocomplete') !== 'off';
      if (isValid) {
        return true;
      }
    }

    // Check if the form contains a last name field.
    const lastNameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.lastName, ['text'], []);
    if (lastNameField && this.isElementVisible(lastNameField)) {
      const isValid = force || lastNameField.getAttribute('autocomplete') !== 'off';
      if (isValid) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create a form entry.
   */
  private detectFormFields(wrapper: HTMLElement | null): FormFields {
    // Keep track of detected fields to prevent overlap
    const detectedFields: HTMLInputElement[] = [];

    // Find fields in priority order (most specific to least specific).
    const emailFields = this.findEmailField(wrapper as HTMLFormElement | null);
    if (emailFields.primary) {
      detectedFields.push(emailFields.primary);
    }
    if (emailFields.confirm) {
      detectedFields.push(emailFields.confirm);
    }

    const passwordFields = this.findPasswordField(wrapper as HTMLFormElement | null);
    if (passwordFields.primary) {
      detectedFields.push(passwordFields.primary);
    }
    if (passwordFields.confirm) {
      detectedFields.push(passwordFields.confirm);
    }

    const usernameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.username, ['text'], detectedFields);
    if (usernameField) {
      detectedFields.push(usernameField);
    }

    const fullNameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.fullName, ['text'], detectedFields);
    if (fullNameField) {
      detectedFields.push(fullNameField);
    }

    const firstNameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.firstName, ['text'], detectedFields);
    if (firstNameField) {
      detectedFields.push(firstNameField);
    }

    const lastNameField = this.findInputField(wrapper as HTMLFormElement | null, CombinedFieldPatterns.lastName, ['text'], detectedFields);
    if (lastNameField) {
      detectedFields.push(lastNameField);
    }

    const birthdateField = this.findBirthdateFields(wrapper as HTMLFormElement | null, detectedFields);
    if (birthdateField.single) {
      detectedFields.push(birthdateField.single);
    }
    if (birthdateField.day) {
      detectedFields.push(birthdateField.day);
    }
    if (birthdateField.month) {
      detectedFields.push(birthdateField.month);
    }
    if (birthdateField.year) {
      detectedFields.push(birthdateField.year);
    }

    const genderField = this.findGenderField(wrapper as HTMLFormElement | null, detectedFields);
    if (genderField.field) {
      detectedFields.push(genderField.field as HTMLInputElement);
    }

    return {
      form: wrapper as HTMLFormElement,
      emailField: emailFields.primary,
      emailConfirmField: emailFields.confirm,
      usernameField,
      passwordField: passwordFields.primary,
      passwordConfirmField: passwordFields.confirm,
      fullNameField,
      firstNameField,
      lastNameField,
      birthdateField,
      genderField
    };
  }
}
