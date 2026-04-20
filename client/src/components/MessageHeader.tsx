import React from 'react';
import { useTranslation } from 'react-i18next';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';
import { isRtlLanguage } from '../i18n';
import { useTranslation as useI18n } from 'react-i18next';
import ContactInfo from './ContactInfo';
import ChatActions from './ChatActions';

interface MessageHeaderProps {
  onBackToList?: () => void;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ onBackToList }) => {
  const { t } = useTranslation();
  const { i18n } = useI18n();
  const isRtl = isRtlLanguage(i18n.language);
  const BackIcon = isRtl ? IoArrowForward : IoArrowBack;

  return (
    <header className="w-full h-16 bg-slate-800 border-b border-slate-700 px-2 flex items-center justify-between gap-1">
      <div className="flex items-center flex-1 min-w-0">
        {onBackToList && (
          <button
            type="button"
            onClick={onBackToList}
            aria-label={t('chat.backToContacts')}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md text-slate-300 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <BackIcon size={22} />
          </button>
        )}
        <ContactInfo />
      </div>
      <ChatActions />
    </header>
  );
};

export default MessageHeader;
