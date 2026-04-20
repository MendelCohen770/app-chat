import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import MessageItem from './MessageItem';
import { useChat } from '../context/useChat';
import { useUser } from '../context/useUser';
import { onNewMessage } from '../service/socket';
import { useAsync } from '../hooks/useAsync';
import { LoadingState, EmptyState, ErrorState } from './ui/States';

type MessageKind = 'text' | 'image' | 'video' | 'audio' | 'file';
type MessageVm = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  type?: MessageKind;
  media?: string;
};

const fetchMessages = async (myId: string, otherId: string): Promise<MessageVm[]> => {
  const baseUrl = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:3000';
  const url = `${baseUrl}/message/getMessages?sender=${myId}&receiver=${otherId}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const rows = (json?.data as any[] | undefined) || [];
  const mapped: MessageVm[] = rows.map((m: any) => ({
    id: m._id,
    text: m.content || '',
    sender: String(m.sender) === myId ? 'me' : 'other',
    timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: m.type as MessageKind | undefined,
    media: m.media,
  }));
  return mapped.reverse();
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
  const rawQuery = chat?.searchQuery || '';
  const searchQuery = rawQuery.trim();
  const scrollReqId = chat?.scrollToBottomRequestId ?? 0;

  const {
    data: items,
    isLoading,
    isError,
    refetch,
    setData,
  } = useAsync<MessageVm[]>(
    async () => {
      if (!myId || !otherId) return [];
      return fetchMessages(myId, otherId);
    },
    { deps: [myId, otherId] },
  );

  const filteredItems = useMemo<MessageVm[]>(() => {
    const all = items || [];
    if (!searchQuery) return all;
    const needle = searchQuery.toLowerCase();
    return all.filter((m) => buildHaystack(m).includes(needle));
  }, [items, searchQuery]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the latest message whenever new messages arrive.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [filteredItems.length]);

  // Explicit scroll-to-bottom request from the header's overflow menu.
  useEffect(() => {
    if (scrollReqId === 0) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [scrollReqId]);

  useEffect(() => {
    if (!myId || !otherId) return;
    const handler = (payload: any) => {
      const { senderId, receiverId, content, createdAt, _id, type, media } = payload || {};
      const relevant =
        (senderId === myId && receiverId === otherId) ||
        (senderId === otherId && receiverId === myId);
      if (!relevant) return;
      const current = (items as MessageVm[] | null) || [];
      if (current.some((m) => m.id === _id)) return;
      setData([
        ...current,
        {
          id: _id,
          text: content || '',
          sender: senderId === myId ? 'me' : 'other',
          timestamp: createdAt
            ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          type: type as MessageKind | undefined,
          media,
        },
      ]);
    };
    onNewMessage(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, otherId, items]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingState title={t('chat.loadingMessages')} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center">
        <ErrorState title={t('chat.messagesError')} onRetry={refetch} />
      </div>
    );
  }

  if (!items || items.length === 0) {
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
      className="h-full w-full overflow-y-auto flex flex-col gap-1 p-4 bg-slate-800"
    >
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
        <MessageItem key={message.id} message={message} highlight={searchQuery} />
      ))}
    </div>
  );
};

export default MessageList;
