import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MessageInput from '../components/MessageInput';
import MessageHeader from '../components/MessageHeader';
import MessageList from '../components/MessageList';
import { useChat } from '../context/ChatContext';
import { EmptyState } from '../components/ui/States';

interface ChatPanelProps {
  onBackToList?: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onBackToList }) => {
  const { t } = useTranslation();
  const chat = useChat();
  const [/* message */, setMessage] = useState<string>('');

  if (!chat?.selectedUser) {
    return (
      <div className="bg-slate-900 w-full h-full flex items-center justify-center">
        <EmptyState title={t('chat.selectContact')} />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 w-full h-full min-h-0 flex flex-col select-none">
      <MessageHeader onBackToList={onBackToList} />
      <div className="flex-1 min-h-0 bg-slate-800">
        <MessageList />
      </div>
      <div className="border-t border-slate-800 bg-slate-900 p-2">
        <MessageInput sendMessage={setMessage} />
      </div>
    </div>
  );
};

export default ChatPanel;
