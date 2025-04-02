import React, { useState } from "react";
import { IoClose } from "react-icons/io5";


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

const UserPanel = () => {
  const [searchInput, setSearchInput] = useState('');
  const [filteredContacts, setFilteredContacts] = useState(contact);
  
  
  const handelInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchInput(e.target.value);
    setFilteredContacts(contact.filter((c) => c.username.toLowerCase().includes(e.target.value.toLowerCase())));
  }

  const closeInput = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setSearchInput('');
    setFilteredContacts(contact);
  }


  return (
    <div className="bg-slate-800 w-full h-full float-start   ">
      <div className="flex justify-center items-start p-3">
        <div className="w-1/5">
          <h1>ddddddd</h1>
          {/* המבורגר: שבתוכו יהיו כל מיני הגדרות. "לפי דעתי זה אמור ליהות קומפוננטה נפרדת". עיין בטלגרם ווב */}
        </div>
        <div className="w-4/5 relative">
          <input
            type="text"
            className="w-full h-11 rounded-xl p-3 bg-slate-700 text-white focus:ring-2 focus:ring-gray-300 focus:outline-none pr-10"
            placeholder="חיפוש"
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
      {filteredContacts.map((c, index) => (
        <div key={index} className="p-2 border-b border-gray-700 ">
          <p className="text-lg font-semibold">{c.username}</p>
          <p>{c.lastTime}</p>
        </div>
      ))}
    </div>
    </div>
  );
};

export default UserPanel;
