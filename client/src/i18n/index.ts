import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import he from './locales/he.json';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = ['he', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const RTL_LANGUAGES: SupportedLanguage[] = ['he'];

export const isRtlLanguage = (lng: string | undefined | null): boolean => {
  if (!lng) return false;
  const base = lng.split('-')[0] as SupportedLanguage;
  return RTL_LANGUAGES.includes(base);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: he },
      en: { translation: en },
    },
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    fallbackLng: 'en',
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'app-chat-lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
