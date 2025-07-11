import { storage } from '#imports';

/**
 * Translation keys for content scripts
 */
export interface IContentTranslations {
  // Common
  new: string;
  cancel: string;
  search: string;

  // Status messages
  vaultLocked: string;
  creatingNewAlias: string;
  noMatchesFound: string;

  // Form labels and placeholders
  searchVault: string;
  serviceName: string;
  email: string;
  username: string;
  generatedPassword: string;
  enterServiceName: string;
  enterEmailAddress: string;
  enterUsername: string;

  // Context menu
  hideFor1Hour: string;
  hidePermanently: string;

  // Create alias popup
  createRandomAlias: string;
  createUsernamePassword: string;
  randomAlias: string;
  usernamePassword: string;
  createAndSaveAlias: string;
  createAndSaveCredential: string;
  randomIdentityDescription: string;
  manualCredentialDescription: string;

  // Error messages
  failedToCreateIdentity: string;
  enterEmailAndOrUsername: string;

  // Context menu
  autofillWithAliasVault: string;
  generateRandomPassword: string;
  passwordCopiedToClipboard: string;
}

/**
 * English translations
 */
const enTranslations: IContentTranslations = {
  new: 'New',
  cancel: 'Cancel',
  search: 'Search',
  vaultLocked: 'AliasVault is locked.',
  creatingNewAlias: 'Creating new alias...',
  noMatchesFound: 'No matches found',
  searchVault: 'Search vault...',
  serviceName: 'Service name',
  email: 'Email',
  username: 'Username',
  generatedPassword: 'Generated Password',
  enterServiceName: 'Enter service name',
  enterEmailAddress: 'Enter email address',
  enterUsername: 'Enter username',
  hideFor1Hour: 'Hide for 1 hour (current site)',
  hidePermanently: 'Hide permanently (current site)',
  createRandomAlias: 'Create random alias',
  createUsernamePassword: 'Create username/password',
  randomAlias: 'Random alias',
  usernamePassword: 'Username/password',
  createAndSaveAlias: 'Create and save alias',
  createAndSaveCredential: 'Create and save credential',
  randomIdentityDescription: 'Generate a random identity with a random email address accessible in AliasVault.',
  manualCredentialDescription: 'Specify your own email address and username.',
  failedToCreateIdentity: 'Failed to create identity. Please try again.',
  enterEmailAndOrUsername: 'Enter email and/or username',
  autofillWithAliasVault: 'Autofill with AliasVault',
  generateRandomPassword: 'Generate random password (copy to clipboard)',
  passwordCopiedToClipboard: 'Password copied to clipboard'
};

/**
 * Dutch translations
 */
const nlTranslations: IContentTranslations = {
  new: 'Nieuw',
  cancel: 'Annuleren',
  search: 'Zoeken',
  vaultLocked: 'AliasVault is vergrendeld.',
  creatingNewAlias: 'Nieuwe alias aanmaken...',
  noMatchesFound: 'Geen resultaten gevonden',
  searchVault: 'Kluis doorzoeken...',
  serviceName: 'Servicenaam',
  email: 'E-mail',
  username: 'Gebruikersnaam',
  generatedPassword: 'Gegenereerd wachtwoord',
  enterServiceName: 'Voer servicenaam in',
  enterEmailAddress: 'Voer e-mailadres in',
  enterUsername: 'Voer gebruikersnaam in',
  hideFor1Hour: 'Verberg voor 1 uur (huidige site)',
  hidePermanently: 'Permanent verbergen (huidige site)',
  createRandomAlias: 'Willekeurige alias aanmaken',
  createUsernamePassword: 'Gebruikersnaam/wachtwoord aanmaken',
  randomAlias: 'Willekeurige alias',
  usernamePassword: 'Gebruikersnaam/wachtwoord',
  createAndSaveAlias: 'Alias aanmaken en opslaan',
  createAndSaveCredential: 'Inloggegevens aanmaken en opslaan',
  randomIdentityDescription: 'Genereer een willekeurige identiteit met een willekeurig e-mailadres toegankelijk in AliasVault.',
  manualCredentialDescription: 'Specificeer je eigen e-mailadres en gebruikersnaam.',
  failedToCreateIdentity: 'Identiteit aanmaken mislukt. Probeer opnieuw.',
  enterEmailAndOrUsername: 'Voer e-mail en/of gebruikersnaam in',
  autofillWithAliasVault: 'Autofill met AliasVault',
  generateRandomPassword: 'Willekeurig wachtwoord genereren (kopiëren naar klembord)',
  passwordCopiedToClipboard: 'Wachtwoord gekopieerd naar klembord'
};

/**
 * All available translations
 */
const translations = {
  en: enTranslations,
  nl: nlTranslations
};

/**
 * Get current language from storage
 */
export async function getCurrentLanguage(): Promise<string> {
  try {
    // Use extension storage API exclusively (reliable across all contexts)
    const langFromStorage = await storage.getItem('local:language') as string;
    if (langFromStorage && ['en', 'nl'].includes(langFromStorage)) {
      return langFromStorage;
    }

    // If no language is set in storage, detect browser language and save it
    const browserLang = navigator.language.split('-')[0];
    const detectedLanguage = ['en', 'nl'].includes(browserLang) ? browserLang : 'en';

    // Save the detected language to storage for future use
    await storage.setItem('local:language', detectedLanguage);

    return detectedLanguage;
  } catch (error) {
    console.error('Failed to get current language:', error);
    return 'en';
  }
}

/**
 * Get translation for a key
 */
export async function t(key: keyof IContentTranslations): Promise<string> {
  const lang = await getCurrentLanguage();
  return translations[lang as keyof typeof translations]?.[key] || translations.en[key];
}

/**
 * Get all translations for current language
 */
export async function getTranslations(): Promise<IContentTranslations> {
  const lang = await getCurrentLanguage();
  return translations[lang as keyof typeof translations] || translations.en;
}
