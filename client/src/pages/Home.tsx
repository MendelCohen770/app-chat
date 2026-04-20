import React, { useEffect } from 'react'
import UserPanel from './UserPanel'
import ChatPanel from './ChatPanel'
import { useUser } from '../context/UserContext';
import { IUser } from '../models/user';
import { connectSocket, disconnectSocket  } from '../service/socket';





interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  profileIcon: string; // כאן תמונה או אייקון
  role: number;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const users: User[] = Array.from({ length: 30 }, (_, index) => ({
    _id: `user${index + 1}`,
    username: `user${index + 1}`,
    email: `user${index + 1}@gmail.com`,
    phone: `05412345${index + 10}`,
    profileIcon: '',
    role: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  const userContext = useUser();
  const user = userContext?.user as IUser | null;

  useEffect(() => {
    if (user) {
      connectSocket(user);
    }
    return () => {
      disconnectSocket();
    };
  }, [user]);
  
 
  return (
    <div className="bg-slate-900 h-svh text-gray-500 flex justify-center items-center flex-col p-4">
      <div className="border-slate-700 border-2 w-full h-full flex relative rounded-xl">

        <div className="absolute top-0 bottom-0 left-1/4 w-0.5 bg-slate-700"></div>

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
