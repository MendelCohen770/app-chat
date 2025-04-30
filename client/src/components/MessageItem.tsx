import React from 'react'
type Message = {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: string;
}

interface MessageItemProps {
    message: Message; 
}


const MessageItem: React.FC<MessageItemProps> = ({message}) => {
  const isMine = message.sender == 'me'; // This should be determined based on the message sender
  return (
    <div className={`relative max-w-[60%]  px-4 py-2 m-1 rounded-2xl text-sm leading-tight break-words inline-block bg-gray-700
      ${isMine
        ? 'bg-green-100 self-end rounded-br-none text-left'
        : 'bg-white self-start border border-gray-300 rounded-bl-none text-left'}
    `}>
      <p className='mb-4'>{message.text}</p>
      <span className='absolute bottom-1  text-[10px] text-gray-500'>{message.timestamp}</span>
    </div>
  )
}

export default MessageItem
