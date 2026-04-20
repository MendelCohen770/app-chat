import React from 'react';
import { useTranslation } from 'react-i18next';

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
};

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { t } = useTranslation();
  const isMine = message.sender === 'me';

  const ariaLabel = isMine
    ? `${t('chat.messageFromMe')} ${message.text} ${message.timestamp}`
    : `${t('chat.messageFrom', { name: '' })} ${message.text} ${message.timestamp}`;

  return (
    <div className={['w-full flex', isMine ? 'justify-end' : 'justify-start'].join(' ')}>
      <article
        aria-label={ariaLabel.trim()}
        className={[
          'relative max-w-[80%] sm:max-w-[65%] px-3 py-2 rounded-2xl text-sm leading-snug break-words',
          isMine
            ? 'bg-orange-500 text-white rounded-br-sm'
            : 'bg-slate-700 text-slate-50 rounded-bl-sm',
        ].join(' ')}
      >
        <p className="whitespace-pre-wrap pe-12">{message.text}</p>
        <span
          className={[
            'absolute bottom-1 end-2 text-[10px] select-none',
            isMine ? 'text-orange-100' : 'text-slate-300',
          ].join(' ')}
        >
          {message.timestamp}
        </span>
      </article>
    </div>
  );
};

export default MessageItem;
