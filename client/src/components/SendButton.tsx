import React from 'react';
import { useTranslation } from 'react-i18next';
import { RiSendPlane2Fill } from 'react-icons/ri';
import { isRtlLanguage } from '../i18n';
import { useTranslation as useI18n } from 'react-i18next';

interface SendButtonProps {
  onSend: () => void;
  disabled?: boolean;
}

const SendButton: React.FC<SendButtonProps> = ({ onSend, disabled }) => {
  const { t } = useTranslation();
  const { i18n } = useI18n();
  const isRtl = isRtlLanguage(i18n.language);

  return (
    <button
      type="button"
      onClick={onSend}
      aria-label={t('chat.sendMessage')}
      disabled={disabled}
      className="inline-flex items-center justify-center h-11 w-11 rounded-md bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
    >
      <RiSendPlane2Fill
        size={22}
        className={isRtl ? 'rotate-180' : ''}
        aria-hidden="true"
      />
    </button>
  );
};

export default SendButton;
