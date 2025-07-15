import { storage } from '#imports';

/**
 * Type for content translations
 */
export type ContentTranslations = {
  [key: string]: string | ContentTranslations;
};

/**
 * Cache for loaded translations to avoid repeated file reads
 */
const translationCache = new Map<string, ContentTranslations>();

/**
 * Get current language from storage
 */
export async function getCurrentLanguage(): Promise<string> {
  try {
    // Use extension storage API exclusively (reliable across all contexts)
    const langFromStorage = await storage.getItem('local:language') as string;
    if (langFromStorage && ['en', 'nl', 'de', 'es', 'fr', 'uk'].includes(langFromStorage)) {
      return langFromStorage;
    }

    // If no language is set in storage, detect browser language and save it
    const browserLang = navigator.language.split('-')[0];
    const detectedLanguage = ['en', 'nl', 'de', 'es', 'fr', 'uk'].includes(browserLang) ? browserLang : 'en';

    // Save the detected language to storage for future use
    await storage.setItem('local:language', detectedLanguage);

    return detectedLanguage;
  } catch (error) {
    console.error('Failed to get current language:', error);
    return 'en';
  }
}

/**
 * Load translations for a specific language
 */
async function loadTranslations(language: string): Promise<ContentTranslations> {
  const cacheKey = `all:${language}`;

  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Dynamically import the consolidated translation file
    const translations = await import(`../../locales/${language}.json`);
    const translationData = translations.default || translations;

    // Cache the translations
    translationCache.set(cacheKey, translationData);

    return translationData;
  } catch (error) {
    console.warn(`Failed to load translations for ${language}`, error);

    // Fallback to English if available
    if (language !== 'en') {
      try {
        const fallbackTranslations = await import(`../../locales/en.json`);
        const fallbackData = fallbackTranslations.default || fallbackTranslations;
        translationCache.set(cacheKey, fallbackData);
        return fallbackData;
      } catch (fallbackError) {
        console.error('Failed to load English fallback translations', fallbackError);
      }
    }

    // Return empty object as last resort
    return {};
  }
}

/**
 * Translation function for non-React contexts
 *
 * @param key - Translation key (supports nested keys like 'auth.loginButton' or 'common.errors.networkError')
 * @param fallback - Fallback text if translation is not found
 * @returns Promise<string> - Translated text
 */
export async function t(
  key: string,
  fallback?: string
): Promise<string> {
  try {
    const language = await getCurrentLanguage();
    const translations = await loadTranslations(language);

    // Support nested keys like 'auth.loginButton' or 'common.errors.networkError'
    const value = getNestedValue(translations, key);

    if (value && typeof value === 'string') {
      return value;
    }

    // If translation not found and we're not using English, try English fallback
    if (language !== 'en') {
      const englishTranslations = await loadTranslations('en');
      const englishValue = getNestedValue(englishTranslations, key);

      if (englishValue && typeof englishValue === 'string') {
        return englishValue;
      }
    }

    // Return fallback or key if no translation found
    return fallback || key;
  } catch (error) {
    console.error('Translation error:', error);
    return fallback || key;
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    return current && typeof current === 'object' && current !== null && key in current
      ? (current as Record<string, unknown>)[key]
      : undefined;
  }, obj);
}
