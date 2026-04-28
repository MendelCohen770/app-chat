import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiFile, FiDownload, FiEdit2, FiTrash2, FiCheck, FiX, FiSmile, FiCornerUpLeft } from 'react-icons/fi';
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
  editedAtIso?: string | null;
  isDeleted?: boolean;
  reactions?: Array<{ userId: string; emoji: string }>;
  replyTo?: {
    id: string;
    text: string;
    sender: 'me' | 'other';
    isDeleted?: boolean;
    type?: MessageKind;
  };
};

export type ReadReceiptStatus = 'sent' | 'delivered' | 'read';

interface MessageItemProps {
  message: Message;
  highlight?: string;
  status?: ReadReceiptStatus;
  isUpdating?: boolean;
  onEdit?: (messageId: string, content: string) => Promise<boolean>;
  onDelete?: (messageId: string) => Promise<boolean>;
  onToggleReaction?: (messageId: string, emoji: string, shouldAdd: boolean) => Promise<boolean>;
  onReply?: () => void;
  onJumpToMessage?: (messageId: string) => void;
  myUserId?: string;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

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

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  highlight,
  status,
  isUpdating,
  onEdit,
  onDelete,
  onToggleReaction,
  onReply,
  onJumpToMessage,
  myUserId,
}) => {
  const { t } = useTranslation();
  const isMine = message.sender === 'me';
  const isDeleted = Boolean(message.isDeleted);
  const mediaUrl = resolveMediaUrl(message.media);
  const hasMedia = !!mediaUrl;
  const [isMediaUnavailable, setIsMediaUnavailable] = useState(false);

  React.useEffect(() => {
    setIsMediaUnavailable(false);
  }, [message.id, mediaUrl, message.type]);

  const isAudio = !isDeleted && !isMediaUnavailable && message.type === 'audio' && hasMedia;
  const isImage = !isDeleted && message.type === 'image' && hasMedia;
  const isVideo = !isDeleted && message.type === 'video' && hasMedia;
  const isFile = !isDeleted && message.type === 'file' && hasMedia;
  const isMediaBubble = isImage || isVideo || isFile;
  const canDelete = isMine && !isDeleted && typeof onDelete === 'function';
  const canEdit = isMine && !isDeleted && !isMediaBubble && !isAudio && typeof onEdit === 'function';
  const canReact = !isDeleted && typeof onToggleReaction === 'function';
  const canReply = !isDeleted && typeof onReply === 'function';

  const fileName = useMemo(() => extractFileName(message), [message]);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);

  React.useEffect(() => {
    if (!isEditing) setDraft(message.text);
  }, [message.text, isEditing]);

  const saveEdit = async () => {
    if (!onEdit) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.text.trim()) {
      setIsEditing(false);
      return;
    }
    const ok = await onEdit(message.id, trimmed);
    if (ok) setIsEditing(false);
  };

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

  const groupedReactions = useMemo(() => {
    const groups = new Map<string, { emoji: string; count: number; mine: boolean }>();
    for (const reaction of message.reactions || []) {
      const emoji = String(reaction.emoji || '').trim();
      if (!emoji) continue;
      const prev = groups.get(emoji);
      groups.set(emoji, {
        emoji,
        count: (prev?.count || 0) + 1,
        mine: Boolean(prev?.mine) || String(reaction.userId) === String(myUserId || ''),
      });
    }
    return Array.from(groups.values());
  }, [message.reactions, myUserId]);

  const replySnippet = (() => {
    const reply = message.replyTo;
    if (!reply) return null;
    if (reply.isDeleted) return t('chat.deletedMessage');
    if (reply.text?.trim()) return reply.text;
    if (reply.type) return t(`chat.reply.typeLabel.${reply.type}`);
    return t('chat.reply.originalUnavailable');
  })();

  const toggleReactionByEmoji = async (emoji: string) => {
    if (!onToggleReaction) return;
    const mine = (message.reactions || []).some(
      (reaction) => String(reaction.userId) === String(myUserId || '') && reaction.emoji === emoji,
    );
    await onToggleReaction(message.id, emoji, !mine);
    setIsReactionPickerOpen(false);
  };

  if (!isDeleted && message.type === 'audio' && isMediaUnavailable) {
    return null;
  }

  return (
    <div className={['w-full flex flex-col gap-1', isMine ? 'items-end' : 'items-start'].join(' ')}>
      <article
        aria-label={ariaLabel.trim()}
        className={[
          'group relative rounded-2xl text-sm leading-snug break-words shadow-sm',
          !isMediaBubble && !isAudio ? 'w-[160px] max-w-[160px]' : 'max-w-[94%] sm:max-w-[82%]',
          isMediaBubble ? 'p-1.5' : 'px-3 py-2.5',
          isMine
            ? 'bg-orange-500 text-white rounded-br-sm'
            : 'bg-slate-700 text-slate-50 rounded-bl-sm border border-slate-600/70',
        ].join(' ')}
      >
        {isAudio && (
          <div className="pe-12">
            <VoiceMessagePlayer
              src={mediaUrl || ''}
              isMine={isMine}
              onUnavailable={() => setIsMediaUnavailable(true)}
            />
          </div>
        )}

        {message.replyTo && (
          <button
            type="button"
            className={[
              'mb-2 block w-full rounded-lg border px-2.5 py-2 text-start',
              isMine
                ? 'border-orange-200/40 bg-orange-400/20 hover:bg-orange-400/30'
                : 'border-slate-500/80 bg-slate-600/70 hover:bg-slate-600',
            ].join(' ')}
            onClick={() => onJumpToMessage?.(message.replyTo?.id || '')}
          >
            <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide opacity-80">
              {t(message.replyTo.sender === 'me' ? 'chat.reply.replyingToMe' : 'chat.reply.replyingToOther')}
            </span>
            <span className="line-clamp-1 block text-xs opacity-95">{replySnippet}</span>
          </button>
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

        {!isAudio && !isMediaBubble && !isEditing && (
          <p className="whitespace-pre-wrap">
            {isDeleted ? t('chat.deletedMessage') : renderHighlighted(message.text, highlight || '')}
          </p>
        )}
        {!isAudio && !isMediaBubble && isEditing && (
          <div className="pe-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-md bg-black/20 p-2 text-sm outline-none"
              disabled={Boolean(isUpdating)}
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-black/20 hover:bg-black/30 disabled:opacity-60"
                onClick={() => {
                  setIsEditing(false);
                  setDraft(message.text);
                }}
                disabled={Boolean(isUpdating)}
              >
                <FiX size={12} />
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
                onClick={saveEdit}
                disabled={Boolean(isUpdating) || !draft.trim()}
              >
                <FiCheck size={12} />
                {t('common.save')}
              </button>
            </div>
          </div>
        )}

        {(canDelete || canEdit || canReact || canReply) && !isEditing && (
          <div className="absolute -top-3 end-2 hidden group-hover:flex items-center gap-1.5 rounded-lg bg-slate-900/90 p-1.5">
            {canReply && (
              <button
                type="button"
                title={t('chat.reply.action')}
                aria-label={t('chat.reply.action')}
                className="rounded-md p-1.5 hover:bg-slate-700 disabled:opacity-60"
                onClick={() => onReply?.()}
                disabled={Boolean(isUpdating)}
              >
                <FiCornerUpLeft size={16} />
              </button>
            )}
            {canReact && (
              <button
                type="button"
                title={t('chat.reactions.add')}
                aria-label={t('chat.reactions.add')}
                className="rounded-md p-1.5 hover:bg-slate-700 disabled:opacity-60"
                onClick={() => setIsReactionPickerOpen((prev) => !prev)}
                disabled={Boolean(isUpdating)}
              >
                <FiSmile size={16} />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                title={t('chat.actions.edit')}
                className="rounded-md p-1.5 hover:bg-slate-700 disabled:opacity-60"
                onClick={() => setIsEditing(true)}
                disabled={Boolean(isUpdating)}
                aria-label={t('chat.actions.edit')}
              >
                <FiEdit2 size={16} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                title={t('chat.actions.delete')}
                className="rounded-md p-1.5 hover:bg-slate-700 disabled:opacity-60"
                onClick={() => void onDelete?.(message.id)}
                disabled={Boolean(isUpdating)}
                aria-label={t('chat.actions.delete')}
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        )}
        {groupedReactions.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {groupedReactions.map((group) => (
              <button
                type="button"
                key={group.emoji}
                className={[
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
                  group.mine
                    ? isMine
                      ? 'border-white/70 bg-white/30 text-white hover:bg-white/40'
                      : 'border-orange-300/80 bg-orange-400/20 text-orange-100 hover:bg-orange-400/30'
                    : isMine
                      ? 'border-white/40 bg-black/15 text-white/95 hover:bg-black/25'
                      : 'border-slate-500/90 bg-slate-700/90 text-slate-100 hover:bg-slate-600/90',
                ].join(' ')}
                onClick={() => void toggleReactionByEmoji(group.emoji)}
                disabled={Boolean(isUpdating) || typeof onToggleReaction !== 'function'}
                title={t('chat.reactions.toggle')}
              >
                <span>{group.emoji}</span>
                <span>{group.count}</span>
              </button>
            ))}
          </div>
        )}
        {isReactionPickerOpen && canReact && (
          <div
            className={[
              'absolute z-20 flex items-center gap-1 rounded-2xl border border-slate-600/90 bg-slate-900/95 px-2 py-1.5 shadow-xl',
              isMine ? 'end-2 top-8' : 'start-2 top-8',
            ].join(' ')}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-full px-1.5 py-1 text-base hover:bg-slate-700 transition-colors"
                onClick={() => void toggleReactionByEmoji(emoji)}
                aria-label={t('chat.reactions.pick', { emoji })}
                title={t('chat.reactions.pick', { emoji })}
                disabled={Boolean(isUpdating)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {Boolean(message.editedAtIso) && !isDeleted && !isEditing && (
          <span
            className={[
              'block text-[10px] opacity-80 mt-1',
              isMine ? 'text-orange-100 text-end pe-12' : 'text-slate-300 text-start',
            ].join(' ')}
          >
            {t('chat.editedSuffix')}
          </span>
        )}

        <span
          className={[
            'select-none inline-flex w-full items-center justify-end gap-1 text-[11px] mt-2',
            isMediaBubble ? 'pe-1' : '',
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
