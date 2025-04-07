import React, { createContext, useContext, useState } from "react";
import { IUser } from "../models/user";




type ChatContextType = {
    selectedUser: IUser | null;
    setSelectedUser: (user: IUser | null) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

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