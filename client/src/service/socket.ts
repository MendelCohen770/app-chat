import io from "socket.io-client";
import { IUser } from "../models/user";
import { API_BASE_URL } from "../config/env";
let socket: ReturnType<typeof io> | null = null;

const SOCKET_URL = API_BASE_URL;

export const connectSocket = (user: IUser | null | undefined) => {
    if (!user) {
        console.warn('connectSocket called without a valid user. Skipping socket connection.');
        return;
    }

    if (socket && socket.connected) {
        return;
    }

    socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: { userId: user._id },
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected');
    });
    socket.on('registered', (payload: { ok: boolean; userId: string }) => {
        console.log('✅ Registered to user room', payload);
    });
    socket.on('connect_error', (err: Error) => {
        console.error('Socket connect_error:', err.message);
    });
    socket.on('disconnect', (reason: string) => {
        console.log('🔌 Socket disconnected:', reason);
    });
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

export const onNewMessage = (handler: (payload: any) => void) => {
    if (!socket) return;
    socket.off('newMessage');
    socket.on('newMessage', handler);
};

// ---------- Presence ----------

export type PresenceHandlers = {
    onList?: (userIds: string[]) => void;
    onOnline?: (userId: string) => void;
    onOffline?: (userId: string) => void;
    onConnect?: () => void;
};

/**
 * Subscribe to presence events from the server.
 * Returns an unsubscribe function that detaches the handlers.
 *
 * Safe to call before the socket is connected: handlers will be attached when
 * the socket exists. The caller is responsible for re-subscribing if the socket
 * instance is replaced (e.g. after disconnectSocket → connectSocket).
 */
export const subscribeToPresence = (handlers: PresenceHandlers): (() => void) => {
    if (!socket) return () => {};
    const s = socket;

    const listHandler = (payload: { userIds: string[] }) => {
        handlers.onList?.(payload?.userIds ?? []);
    };
    const onlineHandler = (payload: { userId: string }) => {
        if (payload?.userId) handlers.onOnline?.(payload.userId);
    };
    const offlineHandler = (payload: { userId: string }) => {
        if (payload?.userId) handlers.onOffline?.(payload.userId);
    };
    const connectHandler = () => handlers.onConnect?.();

    s.on('presence:list', listHandler);
    s.on('presence:online', onlineHandler);
    s.on('presence:offline', offlineHandler);
    s.on('connect', connectHandler);

    return () => {
        s.off('presence:list', listHandler);
        s.off('presence:online', onlineHandler);
        s.off('presence:offline', offlineHandler);
        s.off('connect', connectHandler);
    };
};

/** Ask the server for a fresh snapshot of online users. */
export const requestPresenceList = () => {
    if (!socket) return;
    socket.emit('presence:list');
};
