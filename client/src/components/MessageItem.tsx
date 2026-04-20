import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiFile, FiDownload } from 'react-icons/fi';
import VoiceMessagePlayer from './VoiceMessagePlayer';

type MessageKind = 'text' | 'image' | 'video' | 'audio' | 'file';

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  type?: MessageKind;
  media?: string;
};

interface MessageItemProps {
  message: Message;
}

const resolveMediaUrl = (media?: string): string | undefined => {
  if (!media) return undefined;
  if (/^https?:\/\//i.test(media)) return media;
  const baseUrl = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:3000';
  return `${baseUrl}${media.startsWith('/') ? '' : '/'}${media}`;
};

const extractFileName = (message: Message): string => {
  if (message.text) return message.text;
  if (message.media) {
    const cleaned = message.media.split('?')[0];
    const last = cleaned.split('/').pop() || '';
    return decodeURIComponent(last);
  }
  return '';
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { t } = useTranslation();
  const isMine = message.sender === 'me';
  const mediaUrl = resolveMediaUrl(message.media);
  const hasMedia = !!mediaUrl;
  const isAudio = message.type === 'audio' && hasMedia;
  const isImage = message.type === 'image' && hasMedia;
  const isVideo = message.type === 'video' && hasMedia;
  const isFile = message.type === 'file' && hasMedia;
  const isMediaBubble = isImage || isVideo || isFile;

  const ariaLabel = (() => {
    if (isAudio) {
      const voiceLabel = t('chat.voice.messageLabel');
      return isMine
        ? `${t('chat.messageFromMe')} ${voiceLabel} ${message.timestamp}`
        : `${t('chat.messageFrom', { name: '' })} ${voiceLabel} ${message.timestamp}`;
    }
    if (isImage) {
      const label = t('chat.media.imageLabel');
      return isMine
        ? `${t('chat.messageFromMe')} ${label} ${message.timestamp}`
        : `${t('chat.messageFrom', { name: '' })} ${label} ${message.timestamp}`;
    }
    if (isVideo) {
      const label = t('chat.media.videoLabel');
      return isMine
        ? `${t('chat.messageFromMe')} ${label} ${message.timestamp}`
        : `${t('chat.messageFrom', { name: '' })} ${label} ${message.timestamp}`;
    }
    if (isFile) {
      const label = t('chat.media.fileLabel');
      return isMine
        ? `${t('chat.messageFromMe')} ${label} ${extractFileName(message)} ${message.timestamp}`
        : `${t('chat.messageFrom', { name: '' })} ${label} ${extractFileName(message)} ${message.timestamp}`;
    }
    return isMine
      ? `${t('chat.messageFromMe')} ${message.text} ${message.timestamp}`
      : `${t('chat.messageFrom', { name: '' })} ${message.text} ${message.timestamp}`;
  })();

  return (
    <div className={['w-full flex', isMine ? 'justify-end' : 'justify-start'].join(' ')}>
      <article
        aria-label={ariaLabel.trim()}
        className={[
          'relative max-w-[80%] sm:max-w-[65%] rounded-2xl text-sm leading-snug break-words',
          isMediaBubble ? 'p-1.5' : 'px-3 py-2',
          isMine
            ? 'bg-orange-500 text-white rounded-br-sm'
            : 'bg-slate-700 text-slate-50 rounded-bl-sm',
        ].join(' ')}
      >
        {isAudio && (
          <div className="pe-12">
            <VoiceMessagePlayer src={mediaUrl || ''} isMine={isMine} />
          </div>
        )}

        {isImage && (
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={mediaUrl}
              alt={t('chat.media.imageLabel')}
              className="rounded-xl max-h-80 w-auto max-w-full object-cover"
              loading="lazy"
            />
          </a>
        )}

        {isVideo && (
          <video
            src={mediaUrl}
            controls
            preload="metadata"
            className="rounded-xl max-h-80 w-auto max-w-full"
            aria-label={t('chat.media.videoLabel')}
          />
        )}

        {isFile && (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className={[
              'flex items-center gap-2 rounded-xl px-3 py-2 min-w-[180px]',
              isMine ? 'bg-orange-400/40 hover:bg-orange-400/60' : 'bg-slate-600 hover:bg-slate-500',
            ].join(' ')}
          >
            <FiFile size={22} aria-hidden="true" className="shrink-0" />
            <span className="truncate flex-1 text-sm">{extractFileName(message)}</span>
            <FiDownload size={18} aria-hidden="true" className="shrink-0 opacity-80" />
          </a>
        )}

        {!isAudio && !isMediaBubble && (
          <p className="whitespace-pre-wrap pe-12">{message.text}</p>
        )}

        <span
          className={[
            'select-none',
            isMediaBubble
              ? 'block text-end text-[10px] mt-1 pe-1'
              : 'absolute bottom-1 end-2 text-[10px]',
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
