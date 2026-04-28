import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { BsEmojiSunglasses } from 'react-icons/bs';
import toast from 'react-hot-toast';
import SendButton from './SendButton';
import MediaUploader from './MediaUploader';
import Recordings from './Recordings';
import { useUser } from '../context/useUser';
import { useChat } from '../context/useChat';
import apiClient from '../service/apiClient';
import { emitTypingStart, emitTypingStop } from '../service/socket';

interface sendMessageProps {
  sendMessage: (message: string) => void;
}

// Clear the "typing…" indicator after a short idle window without further
// keystrokes. Tuned to feel snappy while still bridging short pauses.
const TYPING_IDLE_TIMEOUT_MS = 2500;

const MessageInput: React.FC<sendMessageProps> = ({ sendMessage }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>('');
  const [showPicker, setShowPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const userCtx = useUser();
  const chat = useChat();

  const receiverIdRef = useRef<string | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const idleTimerRef = useRef<number | null>(null);

  const clearIdleTimer = () => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const stopTyping = () => {
    clearIdleTimer();
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    const receiverId = receiverIdRef.current;
    if (receiverId) emitTypingStop(receiverId);
  };

  const notifyTyping = (receiverId: string) => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTypingStart(receiverId);
    }
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(() => {
      stopTyping();
    }, TYPING_IDLE_TIMEOUT_MS);
  };

  const selectedUserId = chat?.selectedUser?._id ?? null;

  useEffect(() => {
    const previousReceiver = receiverIdRef.current;
    if (previousReceiver && previousReceiver !== selectedUserId && isTypingRef.current) {
      isTypingRef.current = false;
      clearIdleTimer();
      emitTypingStop(previousReceiver);
    }
    receiverIdRef.current = selectedUserId;
    setMessage('');
  }, [selectedUserId]);

  useEffect(() => {
    return () => {
      clearIdleTimer();
      if (isTypingRef.current && receiverIdRef.current) {
        emitTypingStop(receiverIdRef.current);
        isTypingRef.current = false;
      }
    };
  }, []);

  const handleEmojiClick = (emojiObject: any) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowPicker(false);
    inputRef.current?.focus();
    const receiverId = chat?.selectedUser?._id;
    if (receiverId) notifyTyping(receiverId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    const receiverId = chat?.selectedUser?._id;
    if (!receiverId) return;
    if (value.trim().length > 0) {
      notifyTyping(receiverId);
    } else {
      stopTyping();
    }
  };

  const handleSendMessage = async () => {
    const myId = userCtx?.user?._id;
    const otherId = chat?.selectedUser?._id;
    const trimmed = message.trim();
    if (!myId || !otherId || !trimmed) return;
    setSending(true);
    try {
      await apiClient.post('/message/sendMessage', {
        sender: myId,
        receiver: otherId,
        type: 'text',
        content: trimmed,
      });
      sendMessage(trimmed);
      setMessage('');
      stopTyping();
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
        onChange={handleInputChange}
        onBlur={stopTyping}
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
