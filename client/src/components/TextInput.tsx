import React, { useState } from 'react'
interface TextInputProps {
    onMessageChange:(message: string) => void;
    message: string;
}
const TextInput : React.FC<TextInputProps> = ({onMessageChange, message}) => {
  
  return (
    <div className='w-2/4'>
      <input type="text" 
      placeholder='Message'
      value={message}
      onChange={(e) => onMessageChange(e.target.value)}
      className='w-full h-12 bg-slate-700 text-white rounded-r-lg px-3  focus:outline-none'
      />
    </div>
  )
}

export default TextInput
