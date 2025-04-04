import React from 'react'
import { FaMicrophoneAlt } from "react-icons/fa";

const Recordings = () => {
  return (
    <div className='cursor-pointer bg-slate-700 p-2 w-12 h-12 rounded-lg hover:bg-indigo-500 ml-3'>
      <FaMicrophoneAlt size={30} className='text-indigo-700'/>
    </div>
  )
}

export default Recordings
