import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PresenceContext } from "./PresenceContext";
import { useUser } from "./useUser";
import { getSocket, requestPresenceList, subscribeToPresence } from "../service/socket";

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const userContext = useUser();
    const currentUserId = userContext?.user?._id ?? null;
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!currentUserId) {
            setOnlineUserIds(new Set());
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let attachedSocket = getSocket();
        const attachToCurrentSocket = () => {
            const activeSocket = getSocket();
            if (!activeSocket || activeSocket === attachedSocket) return;
            attachedSocket = activeSocket;

            if (unsubscribe) unsubscribe();
            unsubscribe = subscribeToPresence({
                onList: (userIds) => setOnlineUserIds(new Set(userIds)),
                onOnline: (userId) =>
                    setOnlineUserIds((prev) => {
                        if (prev.has(userId)) return prev;
                        const next = new Set(prev);
                        next.add(userId);
                        return next;
                    }),
                onOffline: (userId) =>
                    setOnlineUserIds((prev) => {
                        if (!prev.has(userId)) return prev;
                        const next = new Set(prev);
                        next.delete(userId);
                        return next;
                    }),
                onConnect: () => requestPresenceList(),
            });
            requestPresenceList();
        };

        // Socket can be recreated (StrictMode, auth transitions), so re-attach
        // listeners whenever the socket instance changes.
        attachedSocket = null;
        attachToCurrentSocket();
        const monitorId = window.setInterval(attachToCurrentSocket, 150);

        return () => {
            window.clearInterval(monitorId);
            if (unsubscribe) unsubscribe();
        };
    }, [currentUserId]);

    const isOnline = useCallback(
        (userId: string | null | undefined) => (userId ? onlineUserIds.has(userId) : false),
        [onlineUserIds],
    );

    const value = useMemo(
        () => ({ onlineUserIds, isOnline }),
        [onlineUserIds, isOnline],
    );

    return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
};
