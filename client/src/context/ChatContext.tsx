import React, { createContext, useContext, useState } from "react";


export interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  profileIcon: string; // כאן תמונה או אייקון
  role: number;
  createdAt: string;
  updatedAt: string;
}

type ChatContextType = {
    selectedUser: User | null;
    setSelectedUser: (user: User | null) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    return (
        <ChatContext.Provider value={{ selectedUser, setSelectedUser }}>
            {children}
        </ChatContext.Provider>
    )
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if(!context){
        console.log("useChat must be used within a ChatProvider");
    }
    return context;
}