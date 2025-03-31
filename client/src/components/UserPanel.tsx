import React from "react";

const UserPanel = () => {
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
      UserPanel
    </div>
  );
};

export default UserPanel;
