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

        // The socket is created by Home on login; poll briefly until it's ready
        // so we can attach our listeners no matter who mounts first.
        let unsubscribe: (() => void) | null = null;
        let cancelled = false;

        const attach = () => {
            if (cancelled) return;
            if (!getSocket()) {
                window.setTimeout(attach, 100);
                return;
            }

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

            // Make sure we have a fresh snapshot right away
            requestPresenceList();
        };

        attach();

        return () => {
            cancelled = true;
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
