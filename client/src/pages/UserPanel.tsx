import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";
import { useChat } from "../context/ChatContext";
import { IUser } from "../models/user";

const UserPanel = () => {
  const [searchInput, setSearchInput] = useState('');
  const [users, setUsers] = useState<IUser[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<IUser[]>([]);

  const chatContext = useChat();
  if (!chatContext) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  const { setSelectedUser, selectedUser } = chatContext;

  useEffect(() => {
    const fetchUsers = async () => {
      const baseUrl = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:3000';
      try {
        const res = await fetch(`${baseUrl}/user/getAllUsers`, { credentials: 'include' });
        const json = await res.json();
        if (json?.isSuccessful && json?.data) {
          setUsers(json.data as IUser[]);
          setFilteredContacts(json.data as IUser[]);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handelInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchInput(e.target.value);
    setFilteredContacts(users.filter((c) => c.username.toLowerCase().includes(e.target.value.toLowerCase())));
  }

  const closeInput = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setSearchInput('');
    setFilteredContacts(users);
  }


  return (
    <div className="bg-gray-900 w-full h-full float-start  select-none ">
      <div className="flex justify-center items-start p-3">
        <div className="w-1/5 flex justify-center items-center p-2">
        <RxHamburgerMenu size={30}/>
          {/* המבורגר: שבתוכו יהיו כל מיני הגדרות. "לפי דעתי זה אמור ליהות קומפוננטה נפרדת". עיין בטלגרם ווב */}
        </div>
        <div className="w-4/5 relative">
          <input
            type="text"
            className="w-full h-11 rounded-2xl p-3 bg-slate-700 text-white focus:ring-2 focus:ring-blue-600 focus:outline-none pr-10"
            placeholder="Search"
            value={searchInput}
            onChange={(e) => handelInput(e)}
          />
           {searchInput && (
        <button
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          onClick={(e) => closeInput(e)}
        >
          <IoClose size={25}  className="text-blue-600 hover:text-blue-400"/>
        </button>
      )}
        </div>
      </div>
      <div className="p-1 max-h-[90%] overflow-y-auto">
      {filteredContacts.map((user) => {
        const isSelected = selectedUser?._id === user._id;
        return (
        <div 
          key={user._id} 
          onClick={() => setSelectedUser(user)} 
          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-800'
          }`}
        >
        {/* תמונת פרופיל או אייקון */}
        <img 
          src={user.profileIcon || 'https://www.prtfl.co.il/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-20-at-14.19.59-1.jpg' || '../../public/simple-user-default-icon-free.png'} 
          alt="profile" 
          className="w-12 h-12 rounded-full mr-4 text-gray-500"
        />
        <div className="flex flex-col">
          <span className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-gray-100'}`}>{user.username}</span>
          <span className={`text-sm ${isSelected ? 'text-gray-200' : 'text-gray-300'}`}>Online</span>
        </div>
      </div>
        );
      })}
    </div>
    </div>
  );
};

export default UserPanel;
