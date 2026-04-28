import io from "socket.io-client";
import { IUser } from "../models/user";
import { API_BASE_URL } from "../config/env";
let socket: ReturnType<typeof io> | null = null;
const newMessageHandlers = new Set<(payload: any) => void>();

const SOCKET_URL = API_BASE_URL;

const forwardNewMessage = (payload: any) => {
    newMessageHandlers.forEach((handler) => {
        try {
            handler(payload);
        } catch (err) {
            console.error('newMessage handler failed:', err);
        }
    });
};

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
    socket.on('newMessage', forwardNewMessage);
};

export const disconnectSocket = () => {
    if (socket) {
        socket.off('newMessage', forwardNewMessage);
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

export const onNewMessage = (handler: (payload: any) => void) => {
    newMessageHandlers.add(handler);
    return () => {
        newMessageHandlers.delete(handler);
    };
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

// ---------- Typing indicators ----------

export type TypingHandlers = {
    onTypingStart?: (userId: string) => void;
    onTypingStop?: (userId: string) => void;
};

/**
 * Subscribe to typing events coming from peers who are typing *to the current user*.
 * Returns an unsubscribe function that detaches the handlers.
 */
export const subscribeToTyping = (handlers: TypingHandlers): (() => void) => {
    if (!socket) return () => {};
    const s = socket;

    const startHandler = (payload: { from: string }) => {
        if (payload?.from) handlers.onTypingStart?.(payload.from);
    };
    const stopHandler = (payload: { from: string }) => {
        if (payload?.from) handlers.onTypingStop?.(payload.from);
    };

    s.on('typing:start', startHandler);
    s.on('typing:stop', stopHandler);

    return () => {
        s.off('typing:start', startHandler);
        s.off('typing:stop', stopHandler);
    };
};

/** Tell the server that the current user started typing to `receiverId`. */
export const emitTypingStart = (receiverId: string) => {
    if (!socket || !receiverId) return;
    socket.emit('typing:start', { to: receiverId });
};

/** Tell the server that the current user stopped typing to `receiverId`. */
export const emitTypingStop = (receiverId: string) => {
    if (!socket || !receiverId) return;
    socket.emit('typing:stop', { to: receiverId });
};

// ---------- Read receipts ----------

export type MessageStatus = 'delivered' | 'read';

export type MessageStatusPayload = {
    ids: string[];
    status: MessageStatus;
    at: string;
    peerId: string;
};

type MessageReadPayload = {
    ids: string[];
    at: string;
    readerId?: string;
    peerId?: string;
    senderId?: string;
};

/**
 * Subscribe to message-status updates. The server emits one event per batch
 * when messages become delivered or are read by the peer. Returns an
 * unsubscribe function.
 */
export const subscribeToMessageStatus = (
    handler: (payload: MessageStatusPayload) => void,
): (() => void) => {
    if (!socket) return () => {};
    const s = socket;
    const wrapped = (payload: MessageStatusPayload) => {
        if (!payload || !Array.isArray(payload.ids) || payload.ids.length === 0) return;
        handler(payload);
    };
    const readAlias = (payload: MessageReadPayload) => {
        if (!payload || !Array.isArray(payload.ids) || payload.ids.length === 0 || !payload.at) return;
        handler({
            ids: payload.ids,
            status: 'read',
            at: payload.at,
            peerId: payload.peerId || payload.readerId || payload.senderId || '',
        });
    };
    s.on('messages:status', wrapped);
    s.on('message:read', readAlias);
    return () => {
        s.off('messages:status', wrapped);
        s.off('message:read', readAlias);
    };
};

/**
 * Tell the server that the current user has read every message sent from
 * `peerId` up to now. Safe to call repeatedly; the server no-ops when there is
 * nothing left to mark.
 */
export const emitMessagesRead = (peerId: string) => {
    if (!socket || !peerId) return;
    socket.emit('message:read', { peerId });
};

export type MessageEditedPayload = {
    _id: string;
    content: string;
    editedAt?: string | null;
    originalContent?: string | null;
    senderId?: string;
    receiverId?: string;
};

export const subscribeToMessageEdited = (
    handler: (payload: MessageEditedPayload) => void,
): (() => void) => {
    if (!socket) return () => {};
    const s = socket;
    const wrapped = (payload: MessageEditedPayload) => {
        if (!payload?._id) return;
        handler(payload);
    };
    s.on('message:edited', wrapped);
    return () => s.off('message:edited', wrapped);
};

export type MessageDeletedPayload = {
    _id: string;
    content?: string;
    isDeleted?: boolean;
    senderId?: string;
    receiverId?: string;
};

export const subscribeToMessageDeleted = (
    handler: (payload: MessageDeletedPayload) => void,
): (() => void) => {
    if (!socket) return () => {};
    const s = socket;
    const wrapped = (payload: MessageDeletedPayload) => {
        if (!payload?._id) return;
        handler(payload);
    };
    s.on('message:deleted', wrapped);
    return () => s.off('message:deleted', wrapped);
};

export type MessageReaction = {
    userId: string;
    emoji: string;
};

export type MessageReactedPayload = {
    _id: string;
    senderId?: string;
    receiverId?: string;
    reactions: MessageReaction[];
};

export const subscribeToMessageReacted = (
    handler: (payload: MessageReactedPayload) => void,
): (() => void) => {
    if (!socket) return () => {};
    const s = socket;
    const wrapped = (payload: MessageReactedPayload) => {
        if (!payload?._id) return;
        if (!Array.isArray(payload.reactions)) return;
        handler(payload);
    };
    s.on('message:reacted', wrapped);
    return () => s.off('message:reacted', wrapped);
};
