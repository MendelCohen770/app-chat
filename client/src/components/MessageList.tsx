import { useEffect, useRef, useState } from 'react'
import MessageItem from './MessageItem'
import { useChat } from '../context/ChatContext'
import { useUser } from '../context/UserContext'
import { onNewMessage } from '../service/socket'

type MessageVm = { id: string; text: string; sender: "me" | "other"; timestamp: string }

const fetchMessages = async (myId: string, otherId: string) => {
  const baseUrl = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:3000';
  const url = `${baseUrl}/message/getMessages?sender=${myId}&receiver=${otherId}`;
  const res = await fetch(url, { credentials: 'include' });
  const json = await res.json();
  return (json?.data as any[] | undefined) || [];
}

const MessageList = () => {
  const chat = useChat();
  const userCtx = useUser();
  const [items, setItems] = useState<MessageVm[]>([]);

  useEffect(() => {
    const myId = userCtx?.user?._id;
    const otherId = chat?.selectedUser?._id;
    if (!myId || !otherId) { setItems([]); return; }
    fetchMessages(myId, otherId).then((rows) => {
      const mapped = rows.map((m: any) => ({
        id: m._id,
        text: m.content || '',
        sender: String(m.sender) === myId ? 'me' : 'other',
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })) as MessageVm[];
      setItems(mapped.reverse());
    }).catch(() => setItems([]));
  }, [chat?.selectedUser?._id, userCtx?.user?._id]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [items.length]);

  useEffect(() => {
    const myId = userCtx?.user?._id;
    const otherId = chat?.selectedUser?._id;
    if (!myId || !otherId) return;
    const handler = (payload: any) => {
      const { senderId, receiverId, content, createdAt, _id } = payload || {};
      const relevant = (senderId === myId && receiverId === otherId) || (senderId === otherId && receiverId === myId);
      if (!relevant) return;
      setItems(prev => ([...prev, {
        id: _id,
        text: content || '',
        sender: senderId === myId ? 'me' : 'other',
        timestamp: createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      }]));
    };
    onNewMessage(handler);
  }, [chat?.selectedUser?._id, userCtx?.user?._id]);

  return (
    <div ref={containerRef} className='bg-zinc-300 flex-1 overflow-y-auto w-9/12 flex flex-col p-4 '>
      {items.map(message => (
        <MessageItem key={message.id} message={message}/>
      ))}
    </div>
  )
}

export default MessageList
