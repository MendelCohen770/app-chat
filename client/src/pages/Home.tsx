import React from 'react'
import UserPanel from '../components/UserPanel'
import ChatPanel from '../components/ChatPanel'

export default function Home() {
  return (
    <div className="bg-slate-900 h-svh text-gray-500 flex justify-center items-center flex-col">
      <div className="border-gray-500 border-2 w-full h-full flex relative">

        <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-gray-500"></div>

        <div className="w-1/4 flex justify-center items-center p-2">
          <UserPanel/>
        </div>

        <div className="w-3/4 flex justify-center items-center p-4">
          <ChatPanel/>
        </div>
        
      </div>
    </div>
  )
}
