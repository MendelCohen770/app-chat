import io from "socket.io-client";
import { IUser } from "../models/user";
let socket: ReturnType<typeof io> | null = null;

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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