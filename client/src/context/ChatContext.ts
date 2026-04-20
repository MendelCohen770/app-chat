import { createContext } from "react";
import { IUser } from "../models/user";

export type ChatContextType = {
    selectedUser: IUser | null;
    setSelectedUser: (user: IUser | null) => void;
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);
