import { createContext } from "react";
import { IUser } from "../models/user";

export type ChatContextType = {
    selectedUser: IUser | null;
    setSelectedUser: (user: IUser | null) => void;
    searchOpen: boolean;
    openSearch: () => void;
    closeSearch: () => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    scrollToBottomRequestId: number;
    requestScrollToBottom: () => void;
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);
