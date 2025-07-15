import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import consolidated translations
import enTranslations from '../locales/en.json';
import nlTranslations from '../locales/nl.json';

import { storage } from '#imports';

const resources = {
  en: {
    translation: enTranslations
  },
  nl: {
    translation: nlTranslations
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

/**
 * Initialize i18n with async language detection
 */
const initI18n = async (): Promise<void> => {
  const language = await detectLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
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
};

// Initialize immediately
initI18n();

export default i18n;