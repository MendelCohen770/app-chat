import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IoArrowBack, IoArrowForward, IoClose } from 'react-icons/io5';
import { GoSearch } from 'react-icons/go';
import { isRtlLanguage } from '../i18n';
import { useTranslation as useI18n } from 'react-i18next';
import ContactInfo from './ContactInfo';
import ChatActions from './ChatActions';
import { useChat } from '../context/useChat';

interface MessageHeaderProps {
  onBackToList?: () => void;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ onBackToList }) => {
  const { t } = useTranslation();
  const { i18n } = useI18n();
  const isRtl = isRtlLanguage(i18n.language);
  const BackIcon = isRtl ? IoArrowForward : IoArrowBack;
  const chat = useChat();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (chat?.searchOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [chat?.searchOpen]);

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      chat?.closeSearch();
    }
  };

  return (
    <header className="w-full bg-slate-800 border-b border-slate-700 flex flex-col">
      <div className="h-16 px-2 flex items-center justify-between gap-1">
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
      </div>

      {chat?.searchOpen && (
        <div className="px-3 pb-3 pt-1 flex items-center gap-2">
          <div className="relative flex-1">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 start-3 flex items-center text-slate-400"
            >
              <GoSearch size={16} />
            </span>
            <input
              ref={inputRef}
              type="search"
              value={chat.searchQuery}
              onChange={(e) => chat.setSearchQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={t('chat.searchInChat.placeholder')}
              aria-label={t('chat.searchInChat.placeholder')}
              className="w-full h-10 ps-9 pe-9 rounded-md bg-slate-700 text-slate-100 placeholder:text-slate-400 border border-slate-600 focus:outline-none focus:border-orange-400 focus-visible:ring-2 focus-visible:ring-orange-400"
            />
            {chat.searchQuery && (
              <button
                type="button"
                onClick={() => chat.setSearchQuery('')}
                aria-label={t('chat.searchInChat.clear')}
                className="absolute inset-y-0 end-2 my-auto h-7 w-7 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                <IoClose size={16} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={chat.closeSearch}
            className="h-10 px-3 rounded-md text-sm text-slate-200 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            {t('chat.searchInChat.close')}
          </button>
        </div>
      )}
    </header>
  );
};

export default MessageHeader;
