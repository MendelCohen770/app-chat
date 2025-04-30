import React from 'react'
import ContactInfo from './ContactInfo'
import ChatActions from './ChatActions'

const MessageHeader = () => {
  return (
    <div className='w-full h-16 bg-gray-800 p-2 flex items-center justify-between'>
      <ContactInfo/>
      <ChatActions/>
    </div>
  )
}

export default MessageHeader
