import React, { useState } from 'react'
import { LuPlus } from "react-icons/lu";
import { MdOutlineClose } from "react-icons/md";


const MediaUploader = () => {
  const [isOpen, setIsOpen] = useState(false);


  return (
    <div onClick={() => setIsOpen(!isOpen)} className='cursor-pointer bg-slate-700 p-2 w-12 h-12 rounded-lg hover:bg-indigo-500 mr-3'>
      {isOpen ? (<MdOutlineClose size={30} className='text-indigo-700' />) : (<LuPlus size={30} className='text-indigo-700'/>) }
      
    </div>
  )
}

export default MediaUploader
