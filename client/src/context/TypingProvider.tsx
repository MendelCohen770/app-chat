import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TypingContext } from "./TypingContext";
import { useUser } from "./useUser";
import { getSocket, subscribeToTyping } from "../service/socket";

// Safety-net timeout: if we never receive a `typing:stop` (e.g. network hiccup
// or peer tab crashes), auto-clear the indicator after a few seconds of silence
// so it does not stay stuck on the UI.
const TYPING_FALLBACK_TIMEOUT_MS = 6000;

export const TypingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const userContext = useUser();
    const currentUserId = userContext?.user?._id ?? null;
    const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
    const timeoutsRef = useRef<Map<string, number>>(new Map());

    const clearTimeoutFor = useCallback((userId: string) => {
        const timers = timeoutsRef.current;
        const existing = timers.get(userId);
        if (existing) {
            window.clearTimeout(existing);
            timers.delete(userId);
        }
    }, []);

    const removeUser = useCallback(
        (userId: string) => {
            clearTimeoutFor(userId);
            setTypingUserIds((prev) => {
                if (!prev.has(userId)) return prev;
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        },
        [clearTimeoutFor],
    );

    const addUser = useCallback(
        (userId: string) => {
            clearTimeoutFor(userId);
            const timers = timeoutsRef.current;
            const timer = window.setTimeout(() => {
                removeUser(userId);
            }, TYPING_FALLBACK_TIMEOUT_MS);
            timers.set(userId, timer);

            setTypingUserIds((prev) => {
                if (prev.has(userId)) return prev;
                const next = new Set(prev);
                next.add(userId);
                return next;
            });
        },
        [clearTimeoutFor, removeUser],
    );

    useEffect(() => {
        if (!currentUserId) {
            setTypingUserIds(new Set());
            return;
        }

        let unsubscribe: (() => void) | null = null;
        let cancelled = false;

        const attach = () => {
            if (cancelled) return;
            if (!getSocket()) {
                window.setTimeout(attach, 100);
                return;
            }

            unsubscribe = subscribeToTyping({
                onTypingStart: addUser,
                onTypingStop: removeUser,
            });
        };

        attach();

        return () => {
            cancelled = true;
            if (unsubscribe) unsubscribe();
        };
    }, [currentUserId, addUser, removeUser]);

    useEffect(() => {
        const timers = timeoutsRef.current;
        return () => {
            timers.forEach((t) => window.clearTimeout(t));
            timers.clear();
        };
    }, []);

    const isTyping = useCallback(
        (userId: string | null | undefined) => (userId ? typingUserIds.has(userId) : false),
        [typingUserIds],
    );

    const value = useMemo(
        () => ({ typingUserIds, isTyping }),
        [typingUserIds, isTyping],
    );

    return <TypingContext.Provider value={value}>{children}</TypingContext.Provider>;
};
