import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import nl from './locales/nl.json';

const resources = {
  en: { translation: en },
  nl: { translation: nl },
};

/**
 * Initialize i18n configuration
 */
const initI18n = async (): Promise<void> => {
  // Always use system language, no custom storage
  const locales = getLocales();
  const deviceLanguage = locales[0]?.languageCode ?? 'en';
  const selectedLanguage = resources[deviceLanguage as keyof typeof resources] ? deviceLanguage : 'en';

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources,
      lng: selectedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

/**
 * Open iOS app settings for language change
 * This function is used to indicate that language should be changed in iOS Settings
 * The actual implementation depends on the platform
 */
export const openAppSettings = (): void => {
  // Implementation handled in settings screen
};

/**
 * Get the current language
 * @returns The current language code
 */
export const getCurrentLanguage = (): string => i18n.language;

export { initI18n };
export default i18n;