import { randomUUID } from "node:crypto";
import { Server, Socket } from "socket.io";
import { logger } from "../utils/logger";
import { runWithLogContext } from "../utils/logger";
import Message from "../models/message.schema";

// userId -> set of active socket ids (a user can have multiple tabs/devices)
const onlineUsers = new Map<string, Set<string>>();

const getOnlineUserIds = (): string[] => Array.from(onlineUsers.keys());
export const isUserOnline = (userId: string): boolean =>
    !!userId && (onlineUsers.get(userId)?.size ?? 0) > 0;

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

/**
 * Mark every message addressed to `receiverId` that has never been delivered
 * as delivered now, then notify each of the original senders so their UIs can
 * flip from ✓ to ✓✓.
 */
const markPendingAsDelivered = async (io: Server, receiverId: string) => {
    try {
        const now = new Date();
        const pending = await Message.find(
            { receiver: receiverId, deliveredAt: null },
            { _id: 1, sender: 1 },
        ).lean();
        if (pending.length === 0) return;

        await Message.updateMany(
            { _id: { $in: pending.map((m) => m._id) } },
            { $set: { deliveredAt: now } },
        );

        // Group ids by sender so each sender gets a single concise event.
        const idsBySender = new Map<string, string[]>();
        for (const m of pending) {
            const senderId = String(m.sender);
            const bucket = idsBySender.get(senderId) ?? [];
            bucket.push(String(m._id));
            idsBySender.set(senderId, bucket);
        }

        const deliveredAtIso = now.toISOString();
        for (const [senderId, ids] of idsBySender) {
            io.to(senderId).emit('messages:status', {
                ids,
                status: 'delivered',
                at: deliveredAtIso,
                peerId: receiverId,
            });
        }
    } catch (err) {
        logger.error({ err, receiverId }, 'Failed to mark pending messages as delivered');
    }
};

/**
 * Mark every message from `peerId` to `userId` as read now, then notify the
 * original sender so their UI can flip ✓✓ to the "read" state.
 */
const markConversationAsRead = async (io: Server, userId: string, peerId: string) => {
    try {
        const now = new Date();
        const unread = await Message.find(
            { receiver: userId, sender: peerId, readAt: null },
            { _id: 1 },
        ).lean();
        if (unread.length === 0) return;

        const ids = unread.map((m) => String(m._id));
        await Message.updateMany(
            { _id: { $in: unread.map((m) => m._id) } },
            { $set: { readAt: now, deliveredAt: now } },
        );

        io.to(peerId).emit('messages:status', {
            ids,
            status: 'read',
            at: now.toISOString(),
            peerId: userId,
        });
        io.to(peerId).emit('message:read', {
            ids,
            at: now.toISOString(),
            readerId: userId,
            peerId: userId,
            senderId: userId,
        });
    } catch (err) {
        logger.error({ err, userId, peerId }, 'Failed to mark conversation as read');
    }
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

                // Any messages that arrived while this user was offline are now
                // considered delivered the moment their session reconnects.
                void markPendingAsDelivered(io, userId);
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

            // Client signals it has viewed every message received from `peerId`.
            const handleReadEvent = (payload: { peerId?: string } = {}) => {
                const peerId = typeof payload?.peerId === "string" ? payload.peerId : undefined;
                if (!userId || !peerId || peerId === userId) return;
                void markConversationAsRead(io, userId, peerId);
            };
            socket.on("messages:read", handleReadEvent);
            socket.on("message:read", handleReadEvent);

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
