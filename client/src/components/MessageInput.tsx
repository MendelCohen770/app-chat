import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { BsEmojiSunglasses } from 'react-icons/bs';
import toast from 'react-hot-toast';
import SendButton from './SendButton';
import MediaUploader from './MediaUploader';
import Recordings from './Recordings';
import { useUser } from '../context/useUser';
import { useChat } from '../context/useChat';

interface sendMessageProps {
  sendMessage: (message: string) => void;
}

const MessageInput: React.FC<sendMessageProps> = ({ sendMessage }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>('');
  const [showPicker, setShowPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const userCtx = useUser();
  const chat = useChat();

  const handleEmojiClick = (emojiObject: any) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowPicker(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    const myId = userCtx?.user?._id;
    const otherId = chat?.selectedUser?._id;
    const trimmed = message.trim();
    if (!myId || !otherId || !trimmed) return;
    const baseUrl = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:3000';
    const url = `${baseUrl}/message/sendMessage`;
    setSending(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sender: myId, receiver: otherId, type: 'text', content: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sendMessage(trimmed);
      setMessage('');
      inputRef.current?.focus();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    } else if (e.key === 'Escape' && showPicker) {
      e.preventDefault();
      setShowPicker(false);
    }
  };

  const hasText = message.trim().length > 0;

  return (
    <div className="relative flex items-center gap-2 w-full">
      <MediaUploader />

      <button
        type="button"
        onClick={() => setShowPicker((v) => !v)}
        aria-label={t(showPicker ? 'chat.closeEmoji' : 'chat.openEmoji')}
        aria-expanded={showPicker}
        aria-haspopup="dialog"
        className="inline-flex items-center justify-center h-11 w-11 rounded-md bg-slate-700 text-indigo-300 hover:bg-slate-600 hover:text-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        <BsEmojiSunglasses size={22} />
      </button>

      {showPicker && (
        <div
          role="dialog"
          aria-label={t('chat.openEmoji')}
          className="absolute bottom-14 start-0 z-20 shadow-xl"
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} theme={'dark' as Theme} />
        </div>
      )}

      <label htmlFor="message-input" className="sr-only">
        {t('chat.messageInputPlaceholder')}
      </label>
      <input
        ref={inputRef}
        id="message-input"
        type="text"
        placeholder={t('chat.messageInputPlaceholder')}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 h-11 bg-slate-700 text-white rounded-md px-3 placeholder:text-slate-400 border border-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        disabled={sending}
        autoComplete="off"
      />

      {hasText ? (
        <SendButton onSend={handleSendMessage} disabled={sending} />
      ) : (
        <Recordings />
      )}
    </div>
  );
};

export default MessageInput;
