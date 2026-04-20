import { Server, Socket } from "socket.io";

// userId -> set of active socket ids (a user can have multiple tabs/devices)
const onlineUsers = new Map<string, Set<string>>();

const getOnlineUserIds = (): string[] => Array.from(onlineUsers.keys());

const setUpSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log("🔌 New client connected:", socket.id);

        // Use handshake auth for user identification
        const userId = (socket.handshake as any)?.auth?.userId as string | undefined;

        if (userId) {
            // @ts-ignore attach for later usage
            socket.userId = userId;
            socket.join(userId);

            const sockets = onlineUsers.get(userId) ?? new Set<string>();
            const wasOffline = sockets.size === 0;
            sockets.add(socket.id);
            onlineUsers.set(userId, sockets);

            console.log(`✅ Socket ${socket.id} joined room for user ${userId}`);
            socket.emit('registered', { ok: true, userId });

            // Send the current online snapshot to the freshly connected socket
            socket.emit('presence:list', { userIds: getOnlineUserIds() });

            // Notify everyone else only when this user transitioned from offline → online
            if (wasOffline) {
                socket.broadcast.emit('presence:online', { userId });
            }
        } else {
            console.warn(`⚠️ No userId provided in handshake auth. socket: ${socket.id}`);
            // Anonymous sockets still get the snapshot so the UI can render immediately
            socket.emit('presence:list', { userIds: getOnlineUserIds() });
        }

        // Allow clients to explicitly resync (e.g. after reconnect)
        socket.on('presence:list', () => {
            socket.emit('presence:list', { userIds: getOnlineUserIds() });
        });

        // Keep socket pathway lightweight: server should persist via controller.
        socket.on("sendMessage", (data: { senderId: string; receiverId: string; content?: string; type?: string; media?: string }) => {
            const { senderId, receiverId } = data || {};
            if (!senderId || !receiverId) return;
            io.to(senderId).to(receiverId).emit("newMessage", data);
        });

        socket.on("disconnect", () => {
            console.log("❌ Client disconnected:", socket.id);

            if (!userId) return;
            const sockets = onlineUsers.get(userId);
            if (!sockets) return;

            sockets.delete(socket.id);
            if (sockets.size === 0) {
                onlineUsers.delete(userId);
                io.emit('presence:offline', { userId });
            } else {
                onlineUsers.set(userId, sockets);
            }
        });
    });
}

let ioInstance: Server | null = null;
export const setIO = (io: Server) => {
    ioInstance = io;
}
export const getIO = (): Server => {
    if (!ioInstance) throw new Error('Socket.IO instance not initialized');
    return ioInstance;
}
export const getOnlineUsers = (): string[] => getOnlineUserIds();
export default setUpSocket;
