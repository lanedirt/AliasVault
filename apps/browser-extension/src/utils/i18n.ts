import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';


// Import all translations
import authEn from '../locales/en/auth.json';
import commonEn from '../locales/en/common.json';
import credentialsEn from '../locales/en/credentials.json';
import emailsEn from '../locales/en/emails.json';
import settingsEn from '../locales/en/settings.json';
import authNl from '../locales/nl/auth.json';
import commonNl from '../locales/nl/common.json';
import credentialsNl from '../locales/nl/credentials.json';
import emailsNl from '../locales/nl/emails.json';
import settingsNl from '../locales/nl/settings.json';

import { storage } from '#imports';

const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    credentials: credentialsEn,
    settings: settingsEn,
    emails: emailsEn
  },
  nl: {
    common: commonNl,
    auth: authNl,
    credentials: credentialsNl,
    settings: settingsNl,
    emails: emailsNl
  }
};

// Detect browser language
/**
 * Detect the user's preferred language from localStorage or browser settings
 */
const detectLanguage = async (): Promise<string> => {
  // Check localStorage first
  const stored = await storage.getItem('local:language') as string;
  if (stored && ['en', 'nl'].includes(stored)) {
    return stored;
  }

  // Fall back to browser language
  const browserLang = navigator.language.split('-')[0];
  return ['en', 'nl'].includes(browserLang) ? browserLang : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: await detectLanguage(),
    fallbackLng: 'en',

    debug: false, // Set to true for development debugging

    interpolation: {
      escapeValue: false // React already escapes
    },

    react: {
      useSuspense: false, // Important for browser extensions
      bindI18n: 'languageChanged loaded', // Bind to language change and loaded events
      bindI18nStore: '' // Don't bind to resource store changes
    }
  });

export default i18n;