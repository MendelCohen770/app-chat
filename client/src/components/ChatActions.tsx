import React from 'react'
import { GoSearch } from "react-icons/go";
import { IoCallOutline } from "react-icons/io5";
import { IoMdMore } from "react-icons/io";


// זה קומפוננטה שנמצאת בצד ימין של המסך כדי לשלוט בכל הפעולות שיש בשיחה
// לדוגמא להתקשר או לחפש.
const ChatActions = () => {
  return (
    <div className='text-white flex items-center justify-around w-1/5'>
      <GoSearch size={20} />
      <IoCallOutline size={20} />
      <IoMdMore size={30} />
    </div>
  )
}

export default ChatActions
