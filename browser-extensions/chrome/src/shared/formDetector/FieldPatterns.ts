/**
 * Type for field patterns. These patterns are used to detect individual fields in the form.
 */
export type FieldPatterns = {
    username: string[];
    firstName: string[];
    lastName: string[];
    fullName: string[];
    email: string[];
    emailConfirm: string[];
    password: string[];
    birthdate: string[];
    gender: string[];
    birthDateDay: string[];
    birthDateMonth: string[];
    birthDateYear: string[];
}

/**
 * Type for gender option patterns. These patterns are used to detect individual gender options (radio/select) in the form.
 */
export type GenderOptionPatterns = {
    male: string[];
    female: string[];
    other: string[];
}

/**
 * English field patterns to detect English form fields.
 */
export const EnglishFieldPatterns: FieldPatterns = {
  username: ['username', 'login', 'identifier', 'user'],
  fullName: ['fullname', 'full-name', 'full name'],
  firstName: ['firstname', 'first-name', 'fname', 'name', 'given-name'],
  lastName: ['lastname', 'last-name', 'lname', 'surname', 'family-name'],
  email: ['email', 'mail', 'emailaddress'],
  emailConfirm: ['confirm', 'verification', 'repeat', 'retype', 'verify'],
  password: ['password', 'pwd', 'pass'],
  birthdate: ['birthdate', 'birth-date', 'dob', 'date-of-birth'],
  gender: ['gender', 'sex'],
  birthDateDay: ['birth-day', 'birthday', 'day', 'birthdate_d'],
  birthDateMonth: ['birth-month', 'birthmonth', 'month', 'birthdate_m'],
  birthDateYear: ['birth-year', 'birthyear', 'year', 'birthdate_y']
};

/**
 * English gender option patterns.
 */
export const EnglishGenderOptionPatterns: GenderOptionPatterns = {
  male: ['male', 'man', 'm', 'gender1'],
  female: ['female', 'woman', 'f', 'gender2'],
  other: ['other', 'diverse', 'custom', 'prefer not', 'unknown', 'gender3']
};

/**
 * Dutch field patterns used to detect Dutch form fields.
 */
export const DutchFieldPatterns: FieldPatterns = {
  username: ['gebruikersnaam', 'gebruiker', 'login', 'identifier'],
  fullName: ['volledige naam'],
  firstName: ['voornaam', 'naam'],
  lastName: ['achternaam'],
  email: ['e-mailadres', 'e-mail'],
  emailConfirm: ['bevestig', 'herhaal', 'verificatie'],
  password: ['wachtwoord', 'pwd'],
  birthdate: ['geboortedatum', 'geboorte-datum'],
  gender: ['geslacht', 'aanhef'],
  birthDateDay: ['dag'],
  birthDateMonth: ['maand'],
  birthDateYear: ['jaar']
};

/**
 * Dutch gender option patterns
 */
export const DutchGenderOptionPatterns: GenderOptionPatterns = {
  male: ['man', 'mannelijk', 'm'],
  female: ['vrouw', 'vrouwelijk', 'v'],
  other: ['anders', 'iets', 'overig', 'onbekend']
};

/**
 * Combined field patterns which includes all supported languages.
 */
export const CombinedFieldPatterns: FieldPatterns = {
  username: [...new Set([...EnglishFieldPatterns.username, ...DutchFieldPatterns.username])],
  fullName: [...new Set([...EnglishFieldPatterns.fullName, ...DutchFieldPatterns.fullName])],
  firstName: [...new Set([...EnglishFieldPatterns.firstName, ...DutchFieldPatterns.firstName])],
  lastName: [...new Set([...EnglishFieldPatterns.lastName, ...DutchFieldPatterns.lastName])],
  /**
   * NOTE: Dutch email patterns should be prioritized over English email patterns due to how
   * the nl-registration-form5.html honeypot field is named. The order of the patterns
   * determine which field is detected. If a pattern entry with higher index is detected, that
   * field will be selected instead of the lower index one.
   */
  email: [...new Set([...DutchFieldPatterns.email, ...EnglishFieldPatterns.email])],
  emailConfirm: [...new Set([...EnglishFieldPatterns.emailConfirm, ...DutchFieldPatterns.emailConfirm])],
  password: [...new Set([...EnglishFieldPatterns.password, ...DutchFieldPatterns.password])],
  birthdate: [...new Set([...EnglishFieldPatterns.birthdate, ...DutchFieldPatterns.birthdate])],
  gender: [...new Set([...EnglishFieldPatterns.gender, ...DutchFieldPatterns.gender])],
  birthDateDay: [...new Set([...EnglishFieldPatterns.birthDateDay, ...DutchFieldPatterns.birthDateDay])],
  birthDateMonth: [...new Set([...EnglishFieldPatterns.birthDateMonth, ...DutchFieldPatterns.birthDateMonth])],
  birthDateYear: [...new Set([...EnglishFieldPatterns.birthDateYear, ...DutchFieldPatterns.birthDateYear])]
};

/**
 * Combined gender option patterns which includes all supported languages.
 */
export const CombinedGenderOptionPatterns: GenderOptionPatterns = {
  male: [...new Set([...EnglishGenderOptionPatterns.male, ...DutchGenderOptionPatterns.male])],
  female: [...new Set([...EnglishGenderOptionPatterns.female, ...DutchGenderOptionPatterns.female])],
  other: [...new Set([...EnglishGenderOptionPatterns.other, ...DutchGenderOptionPatterns.other])]
};