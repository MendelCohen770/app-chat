import { useTranslation } from 'react-i18next';
import { useChat } from '../context/useChat';
import { usePresence } from '../context/usePresence';
import { useTyping } from '../context/useTyping';
import { resolveMediaUrl } from '../hooks/UseUser';
import { ConversationType } from '../models/conversation';

const DEFAULT_AVATAR = 'https://www.prtfl.co.il/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-20-at-14.19.59-1.jpg';

const ContactInfo = () => {
  const { t } = useTranslation();
  const chatContext = useChat();
  const selectedUser = chatContext?.selectedUser;
  const selectedConversation = chatContext?.selectedConversation;
  const isGroup = selectedConversation?.type === ConversationType.group;
  const { isOnline } = usePresence();
  const { isTyping } = useTyping();

  const peerIsTyping = isGroup ? false : isTyping(selectedUser?._id);
  const peerIsOnline = isGroup ? false : isOnline(selectedUser?._id);
  const username = isGroup
    ? selectedConversation?.name || t('chat.groups.unnamed')
    : selectedUser?.username || t('common.unknown');
  const memberCount = selectedConversation?.participants?.length || 0;
  const statusText = peerIsTyping
    ? t('chat.typingWithName', { name: username })
    : isGroup
      ? t('chat.groups.membersCount', { count: memberCount })
      : peerIsOnline
      ? t('common.online')
      : t('common.offline');
  const statusClassName = peerIsTyping
    ? 'text-xs text-orange-300 truncate italic'
    : 'text-xs text-slate-400 truncate';

  return (
    <div className="flex items-center p-2 h-full cursor-pointer flex-1 min-w-0">
      <img
        src={resolveMediaUrl(isGroup ? selectedConversation?.avatar : selectedUser?.profileIcon) || DEFAULT_AVATAR}
        alt=""
        aria-hidden="true"
        className="w-10 h-10 rounded-full me-3 object-cover bg-slate-700"
      />
      <div className="flex flex-col min-w-0">
        <span className="text-base font-semibold text-slate-100 truncate">
          {username}
        </span>
        <span className={statusClassName} aria-live="polite">
          {statusText}
        </span>
      </div>
    </div>
  );
};

export default ContactInfo;
