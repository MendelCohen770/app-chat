import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { i18n, t } = useTranslation();
  const current = (i18n.language?.split('-')[0] || 'en') as SupportedLanguage;

  return (
    <label className={['flex items-center gap-2 text-xs text-slate-400', className].join(' ')}>
      <span className="sr-only sm:not-sr-only">{t('common.language')}</span>
      <select
        aria-label={t('common.language')}
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="h-8 rounded-md bg-slate-700 text-slate-100 text-sm px-2 border border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng}>
            {t(`common.languageNames.${lng}`)}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
