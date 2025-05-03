import React from 'react'
import MessageItem from './MessageItem'

type Message = {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: string;
}

const messages: Message[] = [
  { id: "1", text: "Hey!", sender: "me", timestamp: "10:01" },
  { id: "2", text: "Hi there! 👋", sender: "other", timestamp: "10:02" },
  { id: "3", text: "How are you doing today?", sender: "me", timestamp: "10:03" },
  {
    id: "4",
    text: "I'm doing great, thanks! Just working on a new project. It's taking a lot of time but it's fun.",
    sender: "other",
    timestamp: "10:05",
  },
  {
    id: "5",
    text: "That's awesome. Let me know if you need any help with it.",
    sender: "me",
    timestamp: "10:06",
  },
  {
    id: "6",
    text: "Sure thing! Actually, I'm stuck on one part. It's a bit tricky. Can I call you later?",
    sender: "other",
    timestamp: "10:07",
  },
  {
    id: "7",
    text: "Of course. I should be free after 2 PM.",
    sender: "me",
    timestamp: "10:08",
  },
  {
    id: "8",
    text: "Perfect! I'll send you a quick summary before the call so you can take a look.",
    sender: "other",
    timestamp: "10:09",
  },
  {
    id: "9",
    text: "Sounds good 👍",
    sender: "me",
    timestamp: "10:10",
  },
  {
    id: "10",
    text: "By the way, did you check out the new Telegram update? It has some cool features.",
    sender: "other",
    timestamp: "10:12",
  },
  {
    id: "11",
    text: "Not yet, but I've heard it's really good. Will take a look later today.",
    sender: "me",
    timestamp: "10:13",
  },
  {
    id: "12",
    text: "Okay, talk later!",
    sender: "other",
    timestamp: "10:14",
  },
  {
    id: "13",
    text: "Sure! Bye for now 👋",
    sender: "me",
    timestamp: "10:15",
  },
];

const MessageList = () => {
   
  return (
    <div className='bg-zinc-300 flex-1 overflow-y-auto w-9/12 flex flex-col p-4 '>
      {messages.map( message => (
        <MessageItem message={message}/>
      ))}
    </div>
  )
}

export default MessageList
