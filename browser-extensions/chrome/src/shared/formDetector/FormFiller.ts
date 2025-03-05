import { Credential } from "../types/Credential";
import { FormFields } from "./types/FormFields";
import { CombinedDateOptionPatterns, CombinedGenderOptionPatterns } from "./FieldPatterns";
import { Gender } from "../generators/Identity/types/Gender";
/**
 * Class to fill the fields of a form with the given credential.
 */
export class FormFiller {
  /**
   * Constructor.
   */
  public constructor(
    private readonly form: FormFields,
    private readonly triggerInputEvents: (element: HTMLInputElement | HTMLSelectElement) => void
  ) {}

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
   * Fill the basic fields of the form.
   * @param credential The credential to fill the form with.
   */
  private fillBasicFields(credential: Credential): void {
    if (this.form.usernameField) {
      this.form.usernameField.value = credential.Username;
      this.triggerInputEvents(this.form.usernameField);
    }

    if (this.form.passwordField) {
      this.form.passwordField.value = credential.Password;
      this.triggerInputEvents(this.form.passwordField);
    }

    if (this.form.passwordConfirmField) {
      this.form.passwordConfirmField.value = credential.Password;
      this.triggerInputEvents(this.form.passwordConfirmField);
    }

    if (this.form.emailField) {
      this.form.emailField.value = credential.Email;
      this.triggerInputEvents(this.form.emailField);
    }

    if (this.form.emailConfirmField) {
      this.form.emailConfirmField.value = credential.Email;
      this.triggerInputEvents(this.form.emailConfirmField);
    }

    if (this.form.fullNameField) {
      this.form.fullNameField.value = `${credential.Alias.FirstName} ${credential.Alias.LastName}`;
      this.triggerInputEvents(this.form.fullNameField);
    }

    if (this.form.firstNameField) {
      this.form.firstNameField.value = credential.Alias.FirstName;
      this.triggerInputEvents(this.form.firstNameField);
    }

    if (this.form.lastNameField) {
      this.form.lastNameField.value = credential.Alias.LastName;
      this.triggerInputEvents(this.form.lastNameField);
    }
  }

  /**
   * Fill the birthdate fields of the form.
   * @param credential The credential to fill the form with.
   */
  private fillBirthdateFields(credential: Credential): void {
    // Handle birthdate with input events
    if (this.form.birthdateField.single) {
      if (credential.Alias.BirthDate) {
        const birthDate = new Date(credential.Alias.BirthDate);
        const day = birthDate.getDate().toString().padStart(2, '0');
        const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
        const year = birthDate.getFullYear().toString();

        let formattedDate = '';
        switch (this.form.birthdateField.format) {
          case 'dd/mm/yyyy':
            formattedDate = `${day}/${month}/${year}`;
            break;
          case 'mm/dd/yyyy':
            formattedDate = `${month}/${day}/${year}`;
            break;
          case 'dd-mm-yyyy':
            formattedDate = `${day}-${month}-${year}`;
            break;
          case 'mm-dd-yyyy':
            formattedDate = `${month}-${day}-${year}`;
            break;
          case 'yyyy-mm-dd':
          default:
            formattedDate = `${year}-${month}-${day}`;
            break;
        }

        this.form.birthdateField.single.value = formattedDate;
        this.triggerInputEvents(this.form.birthdateField.single);
      }
    } else if (credential.Alias.BirthDate) {
      const birthDate = new Date(credential.Alias.BirthDate);

      if (this.form.birthdateField.day) {
        const dayElement = this.form.birthdateField.day as HTMLSelectElement | HTMLInputElement;
        if ('options' in dayElement && dayElement.options) {
          const dayValue = birthDate.getDate().toString().padStart(2, '0');
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
          dayElement.value = birthDate.getDate().toString().padStart(2, '0');
        }
        this.triggerInputEvents(dayElement);
      }

      if (this.form.birthdateField.month) {
        const monthElement = this.form.birthdateField.month as HTMLSelectElement | HTMLInputElement;
        if ('options' in monthElement && monthElement.options) {
          // Loop through all supported languages and find a match for the month name.
          CombinedDateOptionPatterns.months.forEach((monthNames, _) => {
            const monthValue = (birthDate.getMonth() + 1).toString().padStart(2, '0');
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
          monthElement.value = (birthDate.getMonth() + 1).toString().padStart(2, '0');
        }
        this.triggerInputEvents(monthElement);
      }

      if (this.form.birthdateField.year) {
        const yearElement = this.form.birthdateField.year as HTMLSelectElement | HTMLInputElement;
        if ('options' in yearElement && yearElement.options) {
          const yearValue = birthDate.getFullYear().toString();
          const yearOption = Array.from(yearElement.options).find(opt =>
            opt.value === yearValue ||
            opt.text === yearValue
          );
          if (yearOption) {
            yearElement.value = yearOption.value;
          }
        } else {
          yearElement.value = birthDate.getFullYear().toString();
        }

        this.triggerInputEvents(yearElement);
      }
    }
  }

  /**
   * Fill the gender fields of the form.
   * @param credential The credential to fill the form with.
   */
  private fillGenderFields(credential: Credential): void {
    // Handle gender with input events
    switch (this.form.genderField.type) {
      case 'select':
        if (this.form.genderField.field) {
          const maleValues = CombinedGenderOptionPatterns.male;
          const femaleValues = CombinedGenderOptionPatterns.female;

          const selectElement = this.form.genderField.field as HTMLSelectElement;
          const options = Array.from(selectElement.options);

          if (credential.Alias.Gender === Gender.Male) {
            const maleOption = options.find(opt =>
              maleValues.includes(opt.value.toLowerCase()) ||
            maleValues.includes(opt.text.toLowerCase())
            );
            if (maleOption) {
              selectElement.value = maleOption.value;
            }
          } else if (credential.Alias.Gender === Gender.Female) {
            const femaleOption = options.find(opt =>
              femaleValues.includes(opt.value.toLowerCase()) ||
            femaleValues.includes(opt.text.toLowerCase())
            );
            if (femaleOption) {
              selectElement.value = femaleOption.value;
            }
          }

          this.triggerInputEvents(selectElement);
        }
        break;
      case 'radio': {
        const radioButtons = this.form.genderField.radioButtons;
        if (!radioButtons) {
          break;
        }

        let selectedRadio: HTMLInputElement | null = null;
        if (credential.Alias.Gender === Gender.Male && radioButtons.male) {
          radioButtons.male.checked = true;
          selectedRadio = radioButtons.male;
        } else if (credential.Alias.Gender === Gender.Female && radioButtons.female) {
          radioButtons.female.checked = true;
          selectedRadio = radioButtons.female;
        } else if (credential.Alias.Gender === Gender.Other && radioButtons.other) {
          radioButtons.other.checked = true;
          selectedRadio = radioButtons.other;
        }

        if (selectedRadio) {
          this.triggerInputEvents(selectedRadio);
        }
        break;
      }
      case 'text':
        if (this.form.genderField.field && credential.Alias.Gender) {
          (this.form.genderField.field as HTMLInputElement).value = credential.Alias.Gender;
          this.triggerInputEvents(this.form.genderField.field as HTMLInputElement);
        }
        break;
    }
  }
}
