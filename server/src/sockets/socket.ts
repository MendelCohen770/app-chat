import { randomUUID } from "node:crypto";
import { Server, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { runWithLogContext } from "../utils/logger";

// userId -> set of active socket ids (a user can have multiple tabs/devices)
const onlineUsers = new Map<string, Set<string>>();

const getOnlineUserIds = (): string[] => Array.from(onlineUsers.keys());

const setUpSocket = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        const correlationId =
            (socket.handshake.headers["x-correlation-id"] as string | undefined) ||
            randomUUID();
        const userId = (socket.handshake as any)?.auth?.userId as string | undefined;

        runWithLogContext({ correlationId, userId, socketId: socket.id }, () => {
            logger.info({ socketId: socket.id }, "Socket connected");

            if (userId) {
                // @ts-ignore attach for later usage
                socket.userId = userId;
                socket.join(userId);

                const sockets = onlineUsers.get(userId) ?? new Set<string>();
                const wasOffline = sockets.size === 0;
                sockets.add(socket.id);
                onlineUsers.set(userId, sockets);

                logger.info({ socketId: socket.id, userId }, "Socket joined user room");
                socket.emit("registered", { ok: true, userId });

                // Send the current online snapshot to the freshly connected socket
                socket.emit("presence:list", { userIds: getOnlineUserIds() });

                // Notify everyone else only when this user transitioned from offline → online
                if (wasOffline) {
                    socket.broadcast.emit("presence:online", { userId });
                }
            } else {
                logger.warn({ socketId: socket.id }, "No userId in handshake auth");
                socket.emit("presence:list", { userIds: getOnlineUserIds() });
            }

            socket.on("presence:list", () => {
                socket.emit("presence:list", { userIds: getOnlineUserIds() });
            });

            socket.on("disconnect", (reason) => {
                logger.info({ socketId: socket.id, reason }, "Socket disconnected");

                if (!userId) return;
                const sockets = onlineUsers.get(userId);
                if (!sockets) return;

                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit("presence:offline", { userId });
                } else {
                    onlineUsers.set(userId, sockets);
                }
            });
        });
    });
};

let ioInstance: Server | null = null;
export const setIO = (io: Server) => {
    ioInstance = io;
};
export const getIO = (): Server => {
    if (!ioInstance) throw new Error("Socket.IO instance not initialized");
    return ioInstance;
};
export const getOnlineUsers = (): string[] => getOnlineUserIds();
export default setUpSocket;
