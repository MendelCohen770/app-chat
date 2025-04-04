import React from 'react'
import { RiSendPlane2Fill } from "react-icons/ri";

interface SendButtonProps {
  onSend: () => void;
}
const SendButton: React.FC<SendButtonProps> = ({onSend}) => {
  return (
    <div onClick={onSend} className='cursor-pointer bg-slate-700 p-2 w-12 h-12 rounded-lg hover:bg-indigo-500 ml-3'>
      <RiSendPlane2Fill size={30} className='text-indigo-700' />
    </div>
  )
}

export default SendButton
