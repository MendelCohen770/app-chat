import React, { useState } from 'react'
import TextInput from './TextInput'
import MessageInput from './MessageInput';

const ChatPanel = () => {
  const [message, setMessage] = useState<string>('');
  const [media, setMedia] = useState<File | null>(null);
  const [emoji, setEmoji] = useState<string>('');
  const [isTexting, setIsTexting] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  
  return (
    <div className='bg-slate-800 w-full h-full flex flex-col justify-end p-4'>
      <div>
        {/* כאן יהיה קומפוננטה של הפרופיל של אותו איש קשר שהמשתמש מדבר איתו */}
      </div>
      <div>
    {/* כאן יהיה קומפוננטה של ה chat עצמו עם המקלדת וההודעות. */}
    <MessageInput 
    sendMessage={setMessage}
    
    />
      </div>
    </div>
  )
}

export default ChatPanel
