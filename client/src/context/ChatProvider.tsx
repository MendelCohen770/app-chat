import React, { useCallback, useEffect, useState } from "react";
import { IUser } from "../models/user";
import { ChatContext } from "./ChatContext";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedUser, setSelectedUserState] = useState<IUser | null>(null);
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [scrollToBottomRequestId, setScrollToBottomRequestId] = useState<number>(0);

    const setSelectedUser = useCallback((user: IUser | null) => {
        setSelectedUserState(user);
    }, []);

    const openSearch = useCallback(() => setSearchOpen(true), []);
    const closeSearch = useCallback(() => {
        setSearchOpen(false);
        setSearchQuery("");
    }, []);

    const requestScrollToBottom = useCallback(() => {
        setScrollToBottomRequestId((id) => id + 1);
    }, []);

    // Reset search whenever the active conversation changes so filters don't
    // silently persist across different contacts.
    useEffect(() => {
        setSearchOpen(false);
        setSearchQuery("");
    }, [selectedUser?._id]);

    return (
        <ChatContext.Provider
            value={{
                selectedUser,
                setSelectedUser,
                searchOpen,
                openSearch,
                closeSearch,
                searchQuery,
                setSearchQuery,
                scrollToBottomRequestId,
                requestScrollToBottom,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
