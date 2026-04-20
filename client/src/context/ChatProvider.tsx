import React, { useState } from "react";
import { IUser } from "../models/user";
import { ChatContext } from "./ChatContext";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

    return (
        <ChatContext.Provider value={{ selectedUser, setSelectedUser }}>
            {children}
        </ChatContext.Provider>
    );
};
