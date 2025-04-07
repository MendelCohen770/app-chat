import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";
import { useChat } from "../context/ChatContext";
import { IUser } from "../models/user";


const contact = [
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },

  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
  {
    icon: '',
    username: 'jak bron',
    lastMassage: '',
    lastTime: new Date().getTime()
  },
]


const users: IUser[] = Array.from({ length: 30 }, (_, index) => ({
  _id: `user${index + 1}`,
  username: `user${index + 1}`,
  email: `user${index + 1}@gmail.com`,
  phone: `05412345${index + 10}`,
  profileIcon: '',
  role: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

const UserPanel = () => {
  const [searchInput, setSearchInput] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(users);

  const chatContext = useChat();
  if (!chatContext) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  const { setSelectedUser} = chatContext;
  
  
  
  
  console.log(filteredContacts);
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
      {filteredContacts.map((user) => (
        <div key={user._id} onClick={() => setSelectedUser(user)} className="flex items-center p-3 rounded-lg hover:bg-gray-800 cursor-pointer">
        {/* תמונת פרופיל או אייקון */}
        <img 
          src={user.profileIcon || '../../public/simple-user-default-icon-free.png'} 
          alt="profile" 
          className="w-12 h-12 rounded-full mr-4 text-gray-500"
        />
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-700">{user.username}</span>
          <span className="text-sm text-gray-500">Online</span>
        </div>
      </div>
      ))}
    </div>
    </div>
  );
};

export default UserPanel;
