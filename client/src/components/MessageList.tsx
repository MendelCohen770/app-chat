import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MessageItem from './MessageItem';
import { useChat } from '../context/useChat';
import { useUser } from '../context/useUser';
import {
  onNewMessage,
  subscribeToMessageStatus,
  subscribeToMessageEdited,
  subscribeToMessageDeleted,
  subscribeToMessageReacted,
  emitMessagesRead,
  type MessageStatusPayload,
} from '../service/socket';
import { MessageListSkeleton, EmptyState, ErrorState } from './ui/States';
import apiClient from '../service/apiClient';
import { MessageType } from '../models/message';
import { ConversationType } from '../models/conversation';

type MessageVm = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  type?: MessageType;
  media?: string;
  replyToId: string | null;
  createdAtIso: string;
  deliveredAtIso: string | null;
  readAtIso: string | null;
  editedAtIso: string | null;
  isDeleted: boolean;
  reactions: Array<{ userId: string; emoji: string }>;
};

type MessagesPage = {
  items: MessageVm[];
  nextCursor: string | null;
  hasMore: boolean;
};

const PAGE_SIZE = 50;

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const toIsoOrNull = (value: unknown): string | null => {
  if (!value) return null;
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const mapRow = (m: any, myId: string): MessageVm => {
  const iso = m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString();
  return {
    id: String(m._id),
    text: m.content || '',
    sender: String(m.sender) === myId ? 'me' : 'other',
    timestamp: formatTime(iso),
    type: m.type as MessageType | undefined,
    media: m.media,
    replyToId: m.replyTo ? String(m.replyTo) : null,
    createdAtIso: iso,
    deliveredAtIso: toIsoOrNull(m.deliveredAt),
    readAtIso: toIsoOrNull(m.readAt),
    editedAtIso: toIsoOrNull(m.editedAt),
    isDeleted: Boolean(m.isDeleted),
    reactions: Array.isArray(m.reactions)
      ? m.reactions.map((r: any) => ({
          userId: String(r.userId),
          emoji: String(r.emoji),
        }))
      : [],
  };
};

const fetchMessagesPage = async (
  myId: string,
  otherId: string | null,
  conversationId: string | null,
  before: string | null,
): Promise<MessagesPage> => {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (conversationId) {
    params.set('conversationId', conversationId);
  } else if (otherId) {
    params.set('sender', myId);
    params.set('receiver', otherId);
  }
  if (before) params.set('before', before);
  const res = await apiClient.get(`/message/getMessages?${params.toString()}`);
  const json: any = res.data;
  const data = json?.data || {};
  const rawItems: any[] = Array.isArray(data.items) ? data.items : [];
  // Server returns newest-first; reverse so oldest appears first in the UI list.
  const items = rawItems.map((m) => mapRow(m, myId)).reverse();
  return {
    items,
    nextCursor: typeof data.nextCursor === 'string' ? data.nextCursor : null,
    hasMore: Boolean(data.hasMore),
  };
};

// Returns a stable haystack we can match the search query against, including
// text content and file names for media messages.
const buildHaystack = (m: MessageVm): string => {
  const parts: string[] = [];
  if (m.text) parts.push(m.text);
  if (m.media) {
    const cleaned = m.media.split('?')[0];
    const last = cleaned.split('/').pop() || '';
    try {
      parts.push(decodeURIComponent(last));
    } catch {
      parts.push(last);
    }
  }
  return parts.join(' ').toLowerCase();
};

const MessageList = () => {
  const { t } = useTranslation();
  const chat = useChat();
  const userCtx = useUser();
  const myId = userCtx?.user?._id;
  const otherId = chat?.selectedUser?._id;
  const selectedConversation = chat?.selectedConversation ?? null;
  const conversationId = selectedConversation?._id ?? null;
  const isGroupChat = selectedConversation?.type === ConversationType.group;
  const rawQuery = chat?.searchQuery || '';
  const searchQuery = rawQuery.trim();
  const scrollReqId = chat?.scrollToBottomRequestId ?? 0;

  const [items, setItems] = useState<MessageVm[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null);
  const [highlightedReplyId, setHighlightedReplyId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const isMarkingReadRef = useRef<boolean>(false);
  const markReadCooldownUntilRef = useRef<number>(0);
  const clearReplyHighlightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearReplyHighlightTimerRef.current !== null) {
        window.clearTimeout(clearReplyHighlightTimerRef.current);
        clearReplyHighlightTimerRef.current = null;
      }
    };
  }, []);

  const loadInitial = useCallback(async () => {
    if (!myId || (!otherId && !conversationId)) {
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
      setStatus('success');
      return;
    }
    setStatus('loading');
    isInitialLoadRef.current = true;
    try {
      const page = await fetchMessagesPage(myId, otherId || null, conversationId, null);
      setItems(page.items);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [myId, otherId, conversationId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadOlder = useCallback(async () => {
    if (!myId || (!otherId && !conversationId)) return;
    if (!hasMore || !nextCursor || isLoadingMore) return;

    const container = containerRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;

    setIsLoadingMore(true);
    try {
      const page = await fetchMessagesPage(myId, otherId || null, conversationId, nextCursor);
      setItems((prev) => {
        if (page.items.length === 0) return prev;
        const existing = new Set(prev.map((m) => m.id));
        const merged = [...page.items.filter((m) => !existing.has(m.id)), ...prev];
        return merged;
      });
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);

      // Preserve visual position so the user doesn't jump when older messages prepend.
      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        const delta = el.scrollHeight - previousScrollHeight;
        el.scrollTop = previousScrollTop + delta;
      });
    } catch {
      // Silently ignore; user can retry by scrolling.
    } finally {
      setIsLoadingMore(false);
    }
  }, [myId, otherId, conversationId, hasMore, nextCursor, isLoadingMore]);

  const filteredItems = useMemo<MessageVm[]>(() => {
    if (!searchQuery) return items;
    const needle = searchQuery.toLowerCase();
    return items.filter((m) => buildHaystack(m).includes(needle));
  }, [items, searchQuery]);

  // Auto-scroll to the latest message on first load and when new messages arrive,
  // but NOT when we prepend older messages (handled in loadOlder).
  useEffect(() => {
    if (isInitialLoadRef.current && items.length > 0) {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      isInitialLoadRef.current = false;
    }
  }, [items.length]);

  // Explicit scroll-to-bottom request from the header's overflow menu.
  useEffect(() => {
    if (scrollReqId === 0) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [scrollReqId]);

  // Infinite scroll upwards: when near the top, request the next older page.
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (e.currentTarget.scrollTop <= 40) {
        loadOlder();
      }
    },
    [loadOlder],
  );

  // Real-time messages: append, but only force-scroll for local outgoing messages.
  useEffect(() => {
    if (!myId || (!otherId && !conversationId)) return;
    const handler = (payload: any) => {
      const {
        senderId,
        receiverId,
        content,
        createdAt,
        _id,
        type,
        media,
        deliveredAt,
        readAt,
        editedAt,
        isDeleted,
        reactions,
        replyTo,
      } =
        payload || {};
      const relevant = conversationId
        ? String(payload?.conversationId || '') === conversationId
        : (senderId === myId && receiverId === otherId) ||
          (senderId === otherId && receiverId === myId);
      if (!relevant) return;
      let appended = false;
      const nextId = String(_id || '');
      setItems((prev) => {
        if (!nextId) return prev;
        if (prev.some((m) => m.id === nextId)) return prev;
        appended = true;
        const iso = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();
        return [
          ...prev,
          {
            id: nextId,
            text: content || '',
            sender: senderId === myId ? 'me' : 'other',
            timestamp: formatTime(iso),
            type: type as MessageType | undefined,
            media,
            replyToId: replyTo ? String(replyTo) : null,
            createdAtIso: iso,
            deliveredAtIso: toIsoOrNull(deliveredAt),
            readAtIso: toIsoOrNull(readAt),
            editedAtIso: toIsoOrNull(editedAt),
            isDeleted: Boolean(isDeleted),
            reactions: Array.isArray(reactions)
              ? reactions.map((r: any) => ({
                  userId: String(r.userId),
                  emoji: String(r.emoji),
                }))
              : [],
          },
        ];
      });
      // Only local sends force-scroll to latest; incoming messages don't move
      // the user's current reading position.
      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        if (senderId === myId) {
          el.scrollTop = el.scrollHeight;
        }
      });
      // Incoming message in the open conversation → immediately mark as read.
      if (appended && senderId === otherId && !isGroupChat && otherId) {
        emitMessagesRead(otherId);
      }
    };
    const unsubscribe = onNewMessage(handler);
    return unsubscribe;
  }, [myId, otherId, conversationId, isGroupChat]);

  const scrollToMessageById = useCallback((messageId: string) => {
    if (!messageId) return;
    const container = containerRef.current;
    if (!container) return;
    const node = container.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedReplyId(messageId);
    if (clearReplyHighlightTimerRef.current !== null) {
      window.clearTimeout(clearReplyHighlightTimerRef.current);
    }
    clearReplyHighlightTimerRef.current = window.setTimeout(() => {
      setHighlightedReplyId((current) => (current === messageId ? null : current));
      clearReplyHighlightTimerRef.current = null;
    }, 1600);
  }, []);

  const triggerReply = useCallback(
    (message: MessageVm) => {
      chat?.setReplyTarget?.({
        id: message.id,
        text: message.text,
        sender: message.sender,
        type: message.type,
        isDeleted: message.isDeleted,
      });
      chat?.requestMessageInputFocus?.();
    },
    [chat],
  );

  useEffect(() => {
    if (!myId || (!otherId && !conversationId)) return;
    const unsubEdited = subscribeToMessageEdited((payload) => {
      const targetId = String(payload._id || '');
      if (!targetId) return;
      setItems((prev) =>
        prev.map((m) =>
          m.id === targetId
            ? {
                ...m,
                text: payload.content || m.text,
                editedAtIso: toIsoOrNull(payload.editedAt) || new Date().toISOString(),
              }
            : m,
        ),
      );
    });
    const unsubDeleted = subscribeToMessageDeleted((payload) => {
      const targetId = String(payload._id || '');
      if (!targetId) return;
      setItems((prev) =>
        prev.map((m) =>
          m.id === targetId
            ? {
                ...m,
                text: payload.content || 'ההודעה נמחקה',
                type: MessageType.text,
                media: undefined,
                isDeleted: true,
                editedAtIso: null,
              }
            : m,
        ),
      );
    });
    const unsubReacted = subscribeToMessageReacted((payload) => {
      const targetId = String(payload._id || '');
      if (!targetId) return;
      setItems((prev) =>
        prev.map((m) =>
          m.id === targetId
            ? {
                ...m,
                reactions: payload.reactions.map((r) => ({
                  userId: String(r.userId),
                  emoji: String(r.emoji),
                })),
              }
            : m,
        ),
      );
    });
    return () => {
      unsubEdited();
      unsubDeleted();
      unsubReacted();
    };
  }, [myId, otherId, conversationId]);

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!messageId) return false;
      setUpdatingMessageId(messageId);
      try {
        const res = await apiClient.patch(`/message/${messageId}`, { content });
        const updated = (res?.data as any)?.data;
        setItems((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  text: updated?.content || content,
                  editedAtIso: toIsoOrNull(updated?.editedAt) || new Date().toISOString(),
                }
              : m,
          ),
        );
        return true;
      } catch {
        return false;
      } finally {
        setUpdatingMessageId((curr) => (curr === messageId ? null : curr));
      }
    },
    [],
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!messageId) return false;
    setUpdatingMessageId(messageId);
    try {
      await apiClient.delete(`/message/${messageId}`);
      setItems((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                text: 'ההודעה נמחקה',
                type: MessageType.text,
                media: undefined,
                isDeleted: true,
                editedAtIso: null,
              }
            : m,
        ),
      );
      return true;
    } catch {
      return false;
    } finally {
      setUpdatingMessageId((curr) => (curr === messageId ? null : curr));
    }
  }, []);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string, shouldAdd: boolean) => {
      if (!messageId) return false;
      if (!emoji) return false;
      setUpdatingMessageId(messageId);
      try {
        const response = shouldAdd
          ? await apiClient.post(`/message/${messageId}/react`, { emoji })
          : await apiClient.request({
              method: 'delete',
              url: `/message/${messageId}/react`,
              data: { emoji },
            });
        const updated = (response?.data as any)?.data;
        if (Array.isArray(updated?.reactions)) {
          setItems((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    reactions: updated.reactions.map((r: any) => ({
                      userId: String(r.userId),
                      emoji: String(r.emoji),
                    })),
                  }
                : m,
            ),
          );
        }
        return true;
      } catch {
        return false;
      } finally {
        setUpdatingMessageId((curr) => (curr === messageId ? null : curr));
      }
    },
    [],
  );

  // Subscribe to message-status updates (✓✓ delivered / read) for this chat.
  useEffect(() => {
    if (!myId || !otherId || isGroupChat) return;
    const unsubscribe = subscribeToMessageStatus((payload: MessageStatusPayload) => {
      // Only care about status for the conversation currently on screen.
      if (payload.peerId !== myId && payload.peerId !== otherId) return;
      const ids = new Set(payload.ids);
      setItems((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          if (!ids.has(m.id)) return m;
          const deliveredAtIso =
            m.deliveredAtIso || (payload.status === 'delivered' ? payload.at : payload.at);
          const readAtIso = payload.status === 'read' ? payload.at : m.readAtIso;
          if (m.deliveredAtIso === deliveredAtIso && m.readAtIso === readAtIso) return m;
          changed = true;
          return { ...m, deliveredAtIso, readAtIso };
        });
        return changed ? next : prev;
      });
    });
    return unsubscribe;
  }, [myId, otherId, isGroupChat]);

  // Mark unread incoming messages as read when they are actually visible on
  // screen. This avoids prematurely marking messages the user hasn't seen yet.
  useEffect(() => {
    if (!myId || !otherId || isGroupChat) return;
    if (status !== 'success') return;
    const container = containerRef.current;
    if (!container) return;

    const unreadFromPeerIds = new Set(
      items
        .filter((m) => m.sender === 'other' && !m.readAtIso)
        .map((m) => m.id),
    );
    if (unreadFromPeerIds.size === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const anyUnreadVisible = entries.some((entry) => {
          if (!entry.isIntersecting) return false;
          const messageId = entry.target.getAttribute('data-message-id');
          if (!messageId) return false;
          return unreadFromPeerIds.has(messageId);
        });
        if (!anyUnreadVisible) return;

        const now = Date.now();
        if (isMarkingReadRef.current) return;
        if (markReadCooldownUntilRef.current > now) return;
        isMarkingReadRef.current = true;
        const completeMarkReadAttempt = () => {
          isMarkingReadRef.current = false;
          markReadCooldownUntilRef.current = Date.now() + 1200;
        };

        void apiClient
          .patch('/message/markRead', { peerId: otherId })
          .then(() => {
            completeMarkReadAttempt();
          })
          .catch(() => {
            // Fallback: still nudge via socket when REST fails.
            emitMessagesRead(otherId);
            completeMarkReadAttempt();
          });
      },
      {
        root: container,
        threshold: 0.6,
      },
    );

    const nodes = container.querySelectorAll<HTMLElement>('[data-message-id]');
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [myId, otherId, status, items, isGroupChat]);

  if (status === 'loading') {
    return <MessageListSkeleton />;
  }

  if (status === 'error') {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <ErrorState title={t('chat.messagesError')} onRetry={loadInitial} className="w-full max-w-md" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState title={t('chat.noMessages')} />
      </div>
    );
  }

  if (searchQuery && filteredItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState title={t('chat.searchInChat.noMatches')} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-label={t('chat.conversation')}
      onScroll={handleScroll}
      className="h-full w-full overflow-y-auto flex flex-col gap-1 p-4 bg-slate-800"
    >
      {hasMore && (
        <div className="flex justify-center py-2" aria-live="polite">
          <span className="text-xs text-slate-400">
            {isLoadingMore ? t('chat.loadingOlder') : t('chat.scrollForOlder')}
          </span>
        </div>
      )}
      {searchQuery && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-0 z-10 -mx-4 -mt-4 px-4 py-2 mb-2 text-xs text-slate-300 bg-slate-800/95 backdrop-blur border-b border-slate-700"
        >
          {t('chat.searchInChat.resultsCount', { count: filteredItems.length })}
        </div>
      )}
      {filteredItems.map((message) => (
        <div
          key={message.id}
          data-message-id={message.id}
          className={
            highlightedReplyId === message.id
              ? 'rounded-xl ring-2 ring-amber-400/80 transition-shadow duration-300'
              : undefined
          }
        >
          <MessageItem
            message={{
              ...message,
              replyTo: message.replyToId
                ? (() => {
                    const repliedMessage = items.find((item) => item.id === message.replyToId);
                    if (!repliedMessage) {
                      return {
                        id: message.replyToId,
                        text: '',
                        sender: 'other' as const,
                        isDeleted: false,
                        type: undefined,
                      };
                    }
                    return {
                      id: repliedMessage.id,
                      text: repliedMessage.text,
                      sender: repliedMessage.sender,
                      isDeleted: repliedMessage.isDeleted,
                      type: repliedMessage.type,
                    };
                  })()
                : undefined,
            }}
            highlight={searchQuery}
            isUpdating={updatingMessageId === message.id}
            onEdit={editMessage}
            onDelete={deleteMessage}
            onToggleReaction={toggleReaction}
            onReply={() => triggerReply(message)}
            onJumpToMessage={scrollToMessageById}
            myUserId={myId}
            status={
              message.sender === 'me'
                ? message.readAtIso
                  ? 'read'
                  : message.deliveredAtIso
                    ? 'delivered'
                    : 'sent'
                : undefined
            }
          />
        </div>
      ))}
    </div>
  );
};

export default MessageList;
