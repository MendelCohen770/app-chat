import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiFile, FiDownload } from 'react-icons/fi';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import { API_BASE_URL } from '../config/env';

type MessageKind = 'text' | 'image' | 'video' | 'audio' | 'file';

type Message = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  type?: MessageKind;
  media?: string;
};

export type ReadReceiptStatus = 'sent' | 'delivered' | 'read';

interface MessageItemProps {
  message: Message;
  highlight?: string;
  status?: ReadReceiptStatus;
}

/**
 * WhatsApp-style read receipts: single check for "sent", double check for
 * "delivered", double check in accent color for "read". Only shown for the
 * current user's outgoing messages; omitted for incoming ones.
 */
const ReadReceipt: React.FC<{ status: ReadReceiptStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const label =
    status === 'read'
      ? t('chat.receipt.read')
      : status === 'delivered'
        ? t('chat.receipt.delivered')
        : t('chat.receipt.sent');

  // Overlapping double-check for delivered/read, single check for sent.
  const tone =
    status === 'read' ? 'text-sky-300' : 'text-orange-100/80';

  return (
    <span
      aria-label={label}
      title={label}
      className={['inline-flex items-center leading-none', tone].join(' ')}
    >
      {status === 'sent' ? (
        <svg viewBox="0 0 16 12" width="14" height="11" aria-hidden="true">
          <path
            d="M1 6.5 L5 10.5 L14.5 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 12" width="18" height="11" aria-hidden="true">
          <path
            d="M1 6.5 L5 10.5 L14.5 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 6.5 L10 10.5 L19.5 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
};

const resolveMediaUrl = (media?: string): string | undefined => {
  if (!media) return undefined;
  if (/^https?:\/\//i.test(media)) return media;
  return `${API_BASE_URL}${media.startsWith('/') ? '' : '/'}${media}`;
};

const extractFileName = (message: Message): string => {
  if (message.text) return message.text;
  if (message.media) {
    const cleaned = message.media.split('?')[0];
    const last = cleaned.split('/').pop() || '';
    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  }
  return '';
};

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Renders `text` with case-insensitive occurrences of `needle` wrapped in a
// highlighted <mark>. Falls back to plain text when there's no active search.
const renderHighlighted = (text: string, needle: string): React.ReactNode => {
  if (!text) return text;
  const trimmed = needle.trim();
  if (!trimmed) return text;
  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    regex.test(part) ? (
      <mark
        key={idx}
        className="bg-yellow-300 text-slate-900 rounded-sm px-0.5"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    ),
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message, highlight, status }) => {
  const { t } = useTranslation();
  const isMine = message.sender === 'me';
  const mediaUrl = resolveMediaUrl(message.media);
  const hasMedia = !!mediaUrl;
  const isAudio = message.type === 'audio' && hasMedia;
  const isImage = message.type === 'image' && hasMedia;
  const isVideo = message.type === 'video' && hasMedia;
  const isFile = message.type === 'file' && hasMedia;
  const isMediaBubble = isImage || isVideo || isFile;

  const fileName = useMemo(() => extractFileName(message), [message]);

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
        ? `${t('chat.messageFromMe')} ${label} ${fileName} ${message.timestamp}`
        : `${t('chat.messageFrom', { name: '' })} ${label} ${fileName} ${message.timestamp}`;
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
            <span className="truncate flex-1 text-sm">
              {renderHighlighted(fileName, highlight || '')}
            </span>
            <FiDownload size={18} aria-hidden="true" className="shrink-0 opacity-80" />
          </a>
        )}

        {!isAudio && !isMediaBubble && (
          <p className="whitespace-pre-wrap pe-12">
            {renderHighlighted(message.text, highlight || '')}
          </p>
        )}

        <span
          className={[
            'select-none inline-flex items-center gap-1',
            isMediaBubble
              ? 'text-end text-[10px] mt-1 pe-1 justify-end'
              : 'absolute bottom-1 end-2 text-[10px]',
            isMine ? 'text-orange-100' : 'text-slate-300',
          ].join(' ')}
        >
          <span>{message.timestamp}</span>
          {isMine && status && <ReadReceipt status={status} />}
        </span>
      </article>
    </div>
  );
};

export default MessageItem;
