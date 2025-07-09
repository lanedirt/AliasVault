import { useTranslation as useReactI18nextTranslation } from 'react-i18next';

/**
 * Custom hook for translation functionality
 * @returns Translation utilities
 */
export const useTranslation = (): {
  t: (key: string, options?: object) => string;
  currentLanguage: string;
} => {
  const { t, i18n } = useReactI18nextTranslation();
  
  return {
    t,
    currentLanguage: i18n.language,
  };
};