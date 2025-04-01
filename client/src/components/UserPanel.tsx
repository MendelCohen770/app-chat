import React, { useState } from "react";

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
  


  return (
    <div className="bg-slate-800 w-full h-full float-start   ">
      <div className="flex justify-center items-start p-3">
        <div className="w-1/5">
          <h1>ddddddd</h1>
          {/* המבורגר: שבתוכו יהיו כל מיני הגדרות. "לפי דעתי זה אמור ליהות קומפוננטה נפרדת". עיין בטלגרם ווב */}
        </div>
        <div className="w-4/5">
          <input
            type="search"
            className="w-full h-11 rounded-xl p-3 bg-slate-700 text-white"
          />
        </div>
      </div>
      <div className="p-1 max-h-[90%] overflow-y-auto">
      {contact.map((c, index) => (
        <div key={index} className="py-2 border-b border-gray-300">
          <p className="text-lg font-semibold">{c.username}</p>
          <p>{c.lastTime}</p>
        </div>
      ))}
    </div>
    </div>
  );
};

export default UserPanel;
