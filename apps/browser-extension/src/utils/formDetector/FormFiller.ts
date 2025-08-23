import { Gender, IdentityHelperUtils } from "@/utils/dist/shared/identity-generator";
import type { Credential } from "@/utils/dist/shared/models/vault";
import { CombinedDateOptionPatterns, CombinedGenderOptionPatterns } from "@/utils/formDetector/FieldPatterns";
import { FormFields } from "@/utils/formDetector/types/FormFields";
/**
 * Class to fill the fields of a form with the given credential.
 */
export class FormFiller {
  /**
   * Constructor.
   */
  public constructor(
    private readonly form: FormFields,
    private readonly triggerInputEvents: (element: HTMLInputElement | HTMLSelectElement, animate?: boolean) => void
  ) {
    /**
     * Trigger input events.
     */
    this.triggerInputEvents = (element: HTMLInputElement | HTMLSelectElement, animate = true) : void => triggerInputEvents(element, animate);
  }

  /**
   * Fill the fields of the form with the given credential.
   * @param credential The credential to fill the form with.
   */
  public fillFields(credential: Credential): void {
    this.fillBasicFields(credential);
    this.fillBirthdateFields(credential);
    this.fillGenderFields(credential);
  }

  /**
   * Set value on an input element, handling both regular inputs and custom elements with shadow DOM.
   * @param element The element to set the value on
   * @param value The value to set
   */
  private setElementValue(element: HTMLInputElement | HTMLSelectElement, value: string): void {
    // Try to set value directly on the element
    element.value = value;
    
    // If it's a custom element with shadow DOM, try to find and fill the actual input
    if (element.shadowRoot) {
      const shadowInput = element.shadowRoot.querySelector('input, textarea') as HTMLInputElement;
      if (shadowInput) {
        shadowInput.value = value;
        // Trigger events on the shadow input as well
        this.triggerInputEvents(shadowInput, false);
      }
    }
    
    // Also check if the element contains a regular child input (non-shadow DOM)
    const childInput = element.querySelector('input, textarea') as HTMLInputElement;
    if (childInput && childInput !== element) {
      childInput.value = value;
      this.triggerInputEvents(childInput, false);
    }
  }

  /**
   * Fill the basic fields of the form.
   * @param credential The credential to fill the form with.
   */
  private fillBasicFields(credential: Credential): void {
    if (this.form.usernameField && credential.Username) {
      this.setElementValue(this.form.usernameField, credential.Username);
      this.triggerInputEvents(this.form.usernameField);
    }

    if (this.form.passwordField && credential.Password) {
      this.fillPasswordField(this.form.passwordField, credential.Password);
    }

    if (this.form.passwordConfirmField && credential.Password) {
      this.fillPasswordField(this.form.passwordConfirmField, credential.Password);
    }

    if (this.form.emailField && (credential.Alias?.Email !== undefined || credential.Username !== undefined)) {
      if (credential.Alias?.Email) {
        this.setElementValue(this.form.emailField, credential.Alias.Email);
        this.triggerInputEvents(this.form.emailField);
      } else if (credential.Username && !this.form.usernameField) {
        /*
         * If current form has no username field AND the credential has a username
         * then we can assume the username should be used as the email.
         */

        /*
         * This applies to the usecase where the AliasVault credential was imported
         * from a previous password manager that only had username/password fields
         * or where the user manually created a credential with only a username/password.
         */
        this.setElementValue(this.form.emailField, credential.Username);
        this.triggerInputEvents(this.form.emailField);
      }
    }

    if (this.form.emailConfirmField && credential.Alias?.Email) {
      this.setElementValue(this.form.emailConfirmField, credential.Alias.Email);
      this.triggerInputEvents(this.form.emailConfirmField);
    }

    if (this.form.fullNameField && credential.Alias?.FirstName && credential.Alias?.LastName) {
      this.setElementValue(this.form.fullNameField, `${credential.Alias.FirstName} ${credential.Alias.LastName}`);
      this.triggerInputEvents(this.form.fullNameField);
    }

    if (this.form.firstNameField && credential.Alias?.FirstName) {
      this.setElementValue(this.form.firstNameField, credential.Alias.FirstName);
      this.triggerInputEvents(this.form.firstNameField);
    }

    if (this.form.lastNameField && credential.Alias?.LastName) {
      this.setElementValue(this.form.lastNameField, credential.Alias.LastName);
      this.triggerInputEvents(this.form.lastNameField);
    }
  }

  /**
   * Fill the password field with the given password. This uses a small delay between each character to simulate human typing.
   * Simulates actual keystroke behavior by appending characters one by one.
   * Supports both regular inputs and custom elements with shadow DOM.
   *
   * @param field The password field to fill.
   * @param password The password to fill the field with.
   */
  private async fillPasswordField(field: HTMLInputElement, password: string): Promise<void> {
    // Find the actual input element (could be in shadow DOM)
    let actualInput = field;
    let isCustomElement = false;
    
    // Check for shadow DOM input
    if (field.shadowRoot) {
      const shadowInput = field.shadowRoot.querySelector('input[type="password"], input') as HTMLInputElement;
      if (shadowInput) {
        actualInput = shadowInput;
        isCustomElement = true;
      }
    } else if (field.tagName.toLowerCase() !== 'input') {
      // Check for child input (non-shadow DOM) only if field is not already an input
      const childInput = field.querySelector('input[type="password"], input') as HTMLInputElement;
      if (childInput) {
        actualInput = childInput;
        isCustomElement = true;
      }
    }

    // Clear the field first
    actualInput.value = '';
    if (isCustomElement) {
      field.value = '';
    }
    this.triggerInputEvents(actualInput, true);

    // Type each character with a small delay
    for (const char of password) {
      // Append the character to the actual input
      actualInput.value += char;
      if (isCustomElement) {
        // Also update the custom element's value property for compatibility
        field.value += char;
      }
      // Small random delay between 5-15ms to simulate human typing
      this.triggerInputEvents(actualInput, false);
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
    }

    this.triggerInputEvents(actualInput, false);
    if (isCustomElement) {
      this.triggerInputEvents(field, false);
    }
  }

  /**
   * Fill the birthdate fields of the form.
   * @param credential The credential to fill the form with.
   */
  private fillBirthdateFields(credential: Credential): void {
    // TODO: when birth date is made optional in datamodel, we can remove this mindate check here.
    if (!IdentityHelperUtils.isValidBirthDate(credential.Alias.BirthDate)) {
      return;
    }

    const birthDate = new Date(credential.Alias.BirthDate);

    if (this.form.birthdateField.single) {
      this.fillSingleBirthdateField(birthDate);
    } else {
      this.fillSeparateBirthdateFields(birthDate);
    }
  }

  /**
   * Fill the single birthdate field.
   * @param birthDate The birthdate to fill the form with.
   */
  private fillSingleBirthdateField(birthDate: Date): void {
    const day = birthDate.getDate().toString().padStart(2, '0');
    const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
    const year = birthDate.getFullYear().toString();

    const formattedDate = this.formatDateString(day, month, year);
    this.form.birthdateField.single!.value = formattedDate;
    this.triggerInputEvents(this.form.birthdateField.single!);
  }

  /**
   * Format the date string based on the format of the birthdate field.
   * @param day The day of the birthdate.
   * @param month The month of the birthdate.
   * @param year The year of the birthdate.
   * @returns The formatted date string.
   */
  private formatDateString(day: string, month: string, year: string): string {
    switch (this.form.birthdateField.format) {
      case 'dd/mm/yyyy': return `${day}/${month}/${year}`;
      case 'mm/dd/yyyy': return `${month}/${day}/${year}`;
      case 'dd-mm-yyyy': return `${day}-${month}-${year}`;
      case 'mm-dd-yyyy': return `${month}-${day}-${year}`;
      case 'yyyy-mm-dd':
      default: return `${year}-${month}-${day}`;
    }
  }

  /**
   * Fill the separate birthdate fields.
   * @param birthDate The birthdate to fill the form with.
   */
  private fillSeparateBirthdateFields(birthDate: Date): void {
    this.fillDayField(birthDate);
    this.fillMonthField(birthDate);
    this.fillYearField(birthDate);
  }

  /**
   * Fill the day field.
   * @param birthDate The birthdate to fill the form with.
   */
  private fillDayField(birthDate: Date): void {
    if (!this.form.birthdateField.day) {
      return;
    }

    const dayElement = this.form.birthdateField.day as HTMLSelectElement | HTMLInputElement;
    const dayValue = birthDate.getDate().toString().padStart(2, '0');

    if ('options' in dayElement && dayElement.options) {
      const dayOption = Array.from(dayElement.options).find(opt =>
        opt.value === dayValue ||
        opt.value === birthDate.getDate().toString() ||
        opt.text === dayValue ||
        opt.text === birthDate.getDate().toString()
      );
      if (dayOption) {
        dayElement.value = dayOption.value;
      }
    } else {
      dayElement.value = dayValue;
    }
    this.triggerInputEvents(dayElement);
  }

  /**
   * Fill the month field.
   * @param birthDate The birthdate to fill the form with.
   */
  private fillMonthField(birthDate: Date): void {
    if (!this.form.birthdateField.month) {
      return;
    }

    const monthElement = this.form.birthdateField.month as HTMLSelectElement | HTMLInputElement;
    const monthValue = (birthDate.getMonth() + 1).toString().padStart(2, '0');

    if ('options' in monthElement && monthElement.options) {
      CombinedDateOptionPatterns.months.forEach(monthNames => {
        const monthOption = Array.from(monthElement.options).find(opt =>
          opt.value === monthValue ||
          opt.value === (birthDate.getMonth() + 1).toString() ||
          opt.text === monthValue ||
          opt.text === (birthDate.getMonth() + 1).toString() ||
          opt.text.toLowerCase() === monthNames[birthDate.getMonth()].toLowerCase() ||
          opt.text.toLowerCase() === monthNames[birthDate.getMonth()].substring(0, 3).toLowerCase()
        );
        if (monthOption) {
          monthElement.value = monthOption.value;
        }
      });
    } else {
      monthElement.value = monthValue;
    }
    this.triggerInputEvents(monthElement);
  }

  /**
   * Fill the year field.
   * @param birthDate The birthdate to fill the form with.
   */
  private fillYearField(birthDate: Date): void {
    if (!this.form.birthdateField.year) {
      return;
    }

    const yearElement = this.form.birthdateField.year as HTMLSelectElement | HTMLInputElement;
    const yearValue = birthDate.getFullYear().toString();

    if ('options' in yearElement && yearElement.options) {
      const yearOption = Array.from(yearElement.options).find(opt =>
        opt.value === yearValue ||
        opt.text === yearValue
      );
      if (yearOption) {
        yearElement.value = yearOption.value;
      }
    } else {
      yearElement.value = yearValue;
    }
    this.triggerInputEvents(yearElement);
  }

  /**
   * Fill the gender fields of the form.
   * @param credential The credential to fill the form with.
   */
  private fillGenderFields(credential: Credential): void {
    switch (this.form.genderField.type) {
      case 'select':
        this.fillGenderSelect(credential.Alias.Gender);
        break;
      case 'radio':
        this.fillGenderRadio(credential.Alias.Gender);
        break;
      case 'text':
        this.fillGenderText(credential.Alias.Gender);
        break;
    }
  }

  /**
   * Fill the gender select field.
   * @param gender The gender to fill the form with.
   */
  private fillGenderSelect(gender: Gender | undefined): void {
    if (!this.form.genderField.field || !gender) {
      return;
    }

    const selectElement = this.form.genderField.field as HTMLSelectElement;
    const options = Array.from(selectElement.options);
    const genderValues = gender === Gender.Male
      ? CombinedGenderOptionPatterns.male
      : CombinedGenderOptionPatterns.female;

    const genderOption = options.find(opt =>
      genderValues.includes(opt.value.toLowerCase()) ||
      genderValues.includes(opt.text.toLowerCase())
    );

    if (genderOption) {
      selectElement.value = genderOption.value;
      this.triggerInputEvents(selectElement);
    }
  }

  /**
   * Fill the gender radio fields.
   * @param gender The gender to fill the form with.
   */
  private fillGenderRadio(gender: Gender | undefined): void {
    const radioButtons = this.form.genderField.radioButtons;
    if (!radioButtons || !gender) {
      return;
    }

    let selectedRadio: HTMLInputElement | null = null;

    if (gender === Gender.Male && radioButtons.male) {
      radioButtons.male.checked = true;
      selectedRadio = radioButtons.male;
    } else if (gender === Gender.Female && radioButtons.female) {
      radioButtons.female.checked = true;
      selectedRadio = radioButtons.female;
    } else if (gender === Gender.Other && radioButtons.other) {
      radioButtons.other.checked = true;
      selectedRadio = radioButtons.other;
    }

    if (selectedRadio) {
      this.triggerInputEvents(selectedRadio);
    }
  }

  /**
   * Fill the gender text field.
   * @param gender The gender to fill the form with.
   */
  private fillGenderText(gender: Gender | undefined): void {
    if (!this.form.genderField.field || !gender) {
      return;
    }

    const inputElement = this.form.genderField.field as HTMLInputElement;
    inputElement.value = gender;
    this.triggerInputEvents(inputElement);
  }
}
