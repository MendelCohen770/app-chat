import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtlLanguage } from './index';

/**
 * Keeps <html dir> and <html lang> in sync with the active i18n language.
 * This lets Tailwind rtl:/ltr: variants and logical utilities (ms-*, me-*, ps-*, pe-*) work.
 */
const DirectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const apply = (lng: string) => {
      const dir = isRtlLanguage(lng) ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lng);
    };
    apply(i18n.language || 'en');
    i18n.on('languageChanged', apply);
    return () => {
      i18n.off('languageChanged', apply);
    };
  }, [i18n]);

  return <>{children}</>;
};

export default DirectionProvider;
