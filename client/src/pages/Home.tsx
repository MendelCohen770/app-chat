import { useEffect, useState } from 'react';
import UserPanel from './UserPanel';
import ChatPanel from './ChatPanel';
import { useUser } from '../context/useUser';
import { useChat } from '../context/useChat';
import { IUser } from '../models/user';
import { connectSocket, disconnectSocket } from '../service/socket';

export default function Home() {
  const userContext = useUser();
  const chatContext = useChat();
  const user = userContext?.user as IUser | null;

  // Mobile two-view pattern: show either the contact list or the conversation.
  // Desktop (>= md) always shows both side by side.
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    if (chatContext?.selectedUser) setMobileView('chat');
  }, [chatContext?.selectedUser]);

  useEffect(() => {
    if (user) connectSocket(user);
    return () => disconnectSocket();
  }, [user]);

  const backToList = () => setMobileView('list');

  return (
    <div className="bg-slate-900 h-svh text-slate-300 flex flex-col p-2 sm:p-4">
      <div className="border-slate-700 border w-full h-full flex flex-col md:flex-row relative rounded-xl overflow-hidden">
        {/* Contact list / side panel */}
        <aside
          aria-label="Contacts"
          className={[
            'md:w-1/3 lg:w-1/4 md:border-e md:border-slate-700 h-full min-h-0',
            mobileView === 'list' ? 'flex' : 'hidden',
            'md:flex',
          ].join(' ')}
        >
          <UserPanel />
        </aside>

        {/* Conversation panel */}
        <section
          aria-label="Conversation"
          className={[
            'md:w-2/3 lg:w-3/4 h-full min-h-0',
            mobileView === 'chat' ? 'flex' : 'hidden',
            'md:flex',
          ].join(' ')}
        >
          <ChatPanel onBackToList={backToList} />
        </section>
      </div>
    </div>
  );
}
