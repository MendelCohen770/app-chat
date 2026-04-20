import { Server, Socket } from "socket.io";

const setUpSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log("🔌 New client connected:", socket.id);
        // Use handshake auth for user identification
        const userId = (socket.handshake as any)?.auth?.userId as string | undefined;
        if (userId) {
            // @ts-ignore attach for later usage
            socket.userId = userId;
            socket.join(userId);
            console.log(`✅ Socket ${socket.id} joined room for user ${userId}`);
            socket.emit('registered', { ok: true, userId });
        } else {
            console.warn(`⚠️ No userId provided in handshake auth. socket: ${socket.id}`);
        }

        // Keep socket pathway lightweight: server should persist via controller.
        socket.on("sendMessage", (data: { senderId: string; receiverId: string; content?: string; type?: string; media?: string }) => {
            const { senderId, receiverId } = data || {};
            if (!senderId || !receiverId) return;
            io.to(senderId).to(receiverId).emit("newMessage", data);
        });
    
        socket.on("disconnect", () => {
          console.log("❌ Client disconnected:", socket.id);
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
export default setUpSocket;