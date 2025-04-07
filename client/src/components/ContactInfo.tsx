import React, { useState } from "react";
import { useChat  } from "../context/ChatContext";

const ContactInfo = () => {
  const chatContext = useChat();

  const selectedUser = chatContext?.selectedUser;


  return (

      <div onClick={() => console.log(selectedUser)} className="flex items-center p-3 h-full hover:bg-gray-800 cursor-pointer">
        {/* תמונת פרופיל או אייקון */}
        <img
          src={
            selectedUser?.profileIcon ||
            "../../public/simple-user-default-icon-free.png"
          }
          alt="profile"
          className="w-12 h-12 rounded-full mr-4 text-gray-500"
        />
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-700">
            {selectedUser?.username || "Unknown User"}
          </span>
          <span className="text-sm text-gray-500">Online</span>
        </div>
      </div>
  );
};

export default ContactInfo;
