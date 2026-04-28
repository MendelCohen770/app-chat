import React, { useCallback, useEffect, useState } from "react";
import { IUser } from "../models/user";
import { ChatContext } from "./ChatContext";
import { useUser } from "./useUser";
import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "../storage/localStorage";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedUser, setSelectedUserState] = useState<IUser | null>(null);
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [scrollToBottomRequestId, setScrollToBottomRequestId] = useState<number>(0);
    const userContext = useUser();
    const currentUserId = userContext?.user?._id ?? null;

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

    useEffect(() => {
        if (!currentUserId) {
            setSelectedUserState(null);
            return;
        }
        const storageKey = STORAGE_KEYS.selectedChatByUser(currentUserId);
        const saved = readStorage<IUser>(storageKey);
        if (saved?._id) {
            setSelectedUserState(saved);
        } else {
            removeStorage(storageKey);
        }
    }, [currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;
        const storageKey = STORAGE_KEYS.selectedChatByUser(currentUserId);
        if (!selectedUser) {
            removeStorage(storageKey);
            return;
        }
        writeStorage(storageKey, selectedUser);
    }, [currentUserId, selectedUser]);

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
