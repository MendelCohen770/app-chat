import { randomUUID } from "node:crypto";
import { Server, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { runWithLogContext } from "../utils/logger";

// userId -> set of active socket ids (a user can have multiple tabs/devices)
const onlineUsers = new Map<string, Set<string>>();

const getOnlineUserIds = (): string[] => Array.from(onlineUsers.keys());

// socketId -> set of userIds that this socket is currently "typing" to.
// Used on disconnect to proactively notify peers so indicators do not get stuck.
const typingTargetsBySocket = new Map<string, Set<string>>();

const addTypingTarget = (socketId: string, targetUserId: string) => {
    const targets = typingTargetsBySocket.get(socketId) ?? new Set<string>();
    targets.add(targetUserId);
    typingTargetsBySocket.set(socketId, targets);
};

const removeTypingTarget = (socketId: string, targetUserId: string) => {
    const targets = typingTargetsBySocket.get(socketId);
    if (!targets) return;
    targets.delete(targetUserId);
    if (targets.size === 0) typingTargetsBySocket.delete(socketId);
};

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

            socket.on("typing:start", (payload: { to?: string } = {}) => {
                const to = typeof payload?.to === "string" ? payload.to : undefined;
                if (!userId || !to || to === userId) return;
                addTypingTarget(socket.id, to);
                io.to(to).emit("typing:start", { from: userId });
            });

            socket.on("typing:stop", (payload: { to?: string } = {}) => {
                const to = typeof payload?.to === "string" ? payload.to : undefined;
                if (!userId || !to || to === userId) return;
                removeTypingTarget(socket.id, to);
                io.to(to).emit("typing:stop", { from: userId });
            });

            socket.on("disconnect", (reason) => {
                logger.info({ socketId: socket.id, reason }, "Socket disconnected");

                const pendingTargets = typingTargetsBySocket.get(socket.id);
                if (pendingTargets && userId) {
                    for (const target of pendingTargets) {
                        io.to(target).emit("typing:stop", { from: userId });
                    }
                }
                typingTargetsBySocket.delete(socket.id);

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
