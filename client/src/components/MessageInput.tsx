import React, { useState } from 'react'
import TextInput from './TextInput'
import EmojiPicker, { Theme } from 'emoji-picker-react';
import SendButton from './SendButton';
import { BsEmojiSunglasses } from "react-icons/bs";
import MediaUploader from './MediaUploader';
import Recordings from './Recordings';

interface sendMessageProps {
  sendMessage: (message: string) => void;
}


const MessageInput : React.FC<sendMessageProps> = ({sendMessage}) => {
  const [message, setMessage] = useState<string>('');
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emojiObject: any) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowPicker(false);
    
  };
  console.log(message);
  
  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
    
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {

  }

  const handleSendMessage = () => {
    sendMessage(message);
    setMessage('');
  }
  return (
    <div className='relative flex justify-center items-end w-full'>
        <MediaUploader/>

      <div className='cursor-pointer bg-slate-700 p-2 w-9 h-12 rounded-l-lg flex justify-start items-center'>
      <button className='' onClick={() => setShowPicker(!showPicker)}><BsEmojiSunglasses size={25} className='hover:text-indigo-400 text-indigo-500' /></button>
      </div>
      {showPicker && (
        <div className='absolute bottom-14 '>
          <EmojiPicker onEmojiClick={handleEmojiClick} theme={'dark' as Theme}/>
        </div>
      )}
      <TextInput onMessageChange={handleMessageChange} message={message}/>
      {message ? (<SendButton onSend={handleSendMessage}/>): (<Recordings/>)}

    </div>
  )
}

export default MessageInput