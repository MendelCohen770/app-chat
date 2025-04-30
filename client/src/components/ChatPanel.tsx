import React, { useState } from 'react'
import TextInput from './TextInput'
import MessageInput from './MessageInput';
import MessageHeader from './MessageHeader';
import MessageList from './MessageList';

const ChatPanel = () => {
  const [message, setMessage] = useState<string>('');
  const [media, setMedia] = useState<File | null>(null);
  const [emoji, setEmoji] = useState<string>('');
  const [isTexting, setIsTexting] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  console.log(message);
  
  
  return (
    <div className='bg-gray-900 w-full h-full flex flex-col select-none '>
      <div className='mb-4'>
        {/* כאן יהיה קומפוננטה של הפרופיל של אותו איש קשר שהמשתמש מדבר איתו */}
        <MessageHeader/>
      </div>
      <div className='bg-gray-800 h-96 overflow-y-auto flex-1'>
        {/* כאן יהיה קומפוננטה של כל ההודעות שהיו עד כה בין שני המשתמשים */}
        <div className=' flex justify-center items-center' >
          {/* הודעות */}
          <MessageList/>
        </div>
      </div>
      <div className='mt-4'>
    {/* כאן יהיה קומפוננטה של ה chat עצמו עם המקלדת וההודעות. */}
    <MessageInput 
    sendMessage={setMessage}
    />
      </div>
    </div>
  )
}

export default ChatPanel
