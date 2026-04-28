import { createContext } from "react";
import { IUser } from "../models/user";
import { MessageType } from "../models/message";
import { IConversation } from "../models/conversation";

export type ChatReplyTarget = {
    id: string;
    text: string;
    sender: 'me' | 'other';
    type?: MessageType;
    isDeleted?: boolean;
};

export type ChatContextType = {
    selectedUser: IUser | null;
    setSelectedUser: (user: IUser | null) => void;
    selectedConversation: IConversation | null;
    setSelectedConversation: (conversation: IConversation | null) => void;
    searchOpen: boolean;
    openSearch: () => void;
    closeSearch: () => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    scrollToBottomRequestId: number;
    requestScrollToBottom: () => void;
    messageInputFocusRequestId: number;
    requestMessageInputFocus: () => void;
    replyTarget: ChatReplyTarget | null;
    setReplyTarget: (target: ChatReplyTarget | null) => void;
    clearReplyTarget: () => void;
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);
