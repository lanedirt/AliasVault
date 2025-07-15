import { storage } from '#imports';

/**
 * Type for content translations
 */
export type ContentTranslations = {
  [key: string]: string;
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
 * Load translations for a specific namespace and language
 */
async function loadTranslations(namespace: string, language: string): Promise<ContentTranslations> {
  const cacheKey = `${namespace}:${language}`;

  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // Dynamically import the translation file
    const translations = await import(`../../locales/${language}/${namespace}.json`);
    const translationData = translations.default || translations;

    // Cache the translations
    translationCache.set(cacheKey, translationData);

    return translationData;
  } catch (error) {
    console.warn(`Failed to load translations for ${namespace}:${language}`, error);

    // Fallback to English if available
    if (language !== 'en') {
      try {
        const fallbackTranslations = await import(`../../locales/en/${namespace}.json`);
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
 * @param key - Translation key (supports nested keys like 'errors.networkError')
 * @param namespace - Translation namespace (default: 'content')
 * @param fallback - Fallback text if translation is not found
 * @returns Promise<string> - Translated text
 */
export async function t(
  key: string,
  namespace: string = 'content',
  fallback?: string
): Promise<string> {
  try {
    const language = await getCurrentLanguage();
    const translations = await loadTranslations(namespace, language);

    // Support nested keys like 'errors.networkError'
    const value = getNestedValue(translations, key);

    if (value && typeof value === 'string') {
      return value;
    }

    // If translation not found and we're not using English, try English fallback
    if (language !== 'en') {
      const englishTranslations = await loadTranslations(namespace, 'en');
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
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Translation function specifically for content scripts
 * This is a convenience wrapper around the main t() function
 */
export async function tc(key: string, fallback?: string): Promise<string> {
  return t(key, 'content', fallback);
}

/**
 * Translation function for errors namespace
 */
export async function te(key: string, fallback?: string): Promise<string> {
  return t(key, 'errors', fallback);
}

/**
 * Translation function for common namespace
 */
export async function tcommon(key: string, fallback?: string): Promise<string> {
  return t(key, 'common', fallback);
}

/**
 * Clear translation cache (useful for language changes)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Pre-load common translations for use in synchronous contexts
 */
export async function preloadTranslationsForSync(
  namespaces: string[] = ['common', 'errors']
): Promise<Record<string, ContentTranslations>> {
  const languages = ['en', 'nl'];
  const translations: Record<string, ContentTranslations> = {};

  for (const lang of languages) {
    const langTranslations: ContentTranslations = {};

    for (const namespace of namespaces) {
      try {
        const nsTranslations = await loadTranslations(namespace, lang);
        // Flatten the namespace structure for easier access
        Object.keys(nsTranslations).forEach(key => {
          if (namespace === 'common' && key === 'errors') {
            // Handle nested errors object
            const errors = nsTranslations[key] as Record<string, string>;
            Object.keys(errors).forEach(errorKey => {
              langTranslations[`errors.${errorKey}`] = errors[errorKey];
            });
          } else {
            langTranslations[key] = nsTranslations[key];
          }
        });
      } catch (error) {
        console.warn(`Failed to preload ${namespace} translations for ${lang}:`, error);
      }
    }

    translations[lang] = langTranslations;
  }

  return translations;
}
