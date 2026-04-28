import Message from "../models/message.schema";
import { ConversationType, MessageType } from "../../../shared/types/domain";
import Conversation from "../models/conversation.schema";
import { getIO, isUserOnline } from "../sockets/socket";
import { Request, Response } from "express";
import { genericResponse } from '../utils/helper';
import path from 'path';
import fs from 'fs';
import { enforceUploadPolicy } from "../middlewares/upload";
import { asyncHandler, AppError } from '../middlewares/errorHandler';

const safeUnlink = (p?: string) => {
    if (!p) return;
    try { fs.unlinkSync(p); } catch (_) { /* ignore */ }
};

const objectIdRegex = /^[a-f\d]{24}$/i;
const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;

const emitToConversationParticipants = async (conversationId: string, eventName: string, payload: any) => {
    try {
        const io = getIO();
        const conversation = await Conversation.findById(conversationId).select('participants');
        if (!conversation) return;
        const participantIds = Array.isArray(conversation.participants)
            ? conversation.participants.map((id: any) => String(id))
            : [];
        participantIds.forEach((participantId) => {
            io.to(participantId).emit(eventName, payload);
        });
    } catch (_) {
        // socket not ready / not initialised – safe to skip
    }
};

const emitNewMessage = async (message: any) => {
    await emitToConversationParticipants(String(message.conversationId), 'newMessage', {
        _id: message._id,
        conversationId: String(message.conversationId),
        senderId: String(message.sender),
        receiverId: message.receiver ? String(message.receiver) : null,
        replyTo: message.replyTo ? String(message.replyTo) : null,
        type: message.type,
        content: message.content,
        originalContent: message.originalContent || null,
        media: message.media,
        createdAt: message.createdAt,
        deliveredAt: message.deliveredAt || null,
        readAt: message.readAt || null,
        editedAt: message.editedAt || null,
        isDeleted: Boolean(message.isDeleted),
        reactions: Array.isArray(message.reactions)
            ? message.reactions.map((reaction: any) => ({
                userId: String(reaction.userId),
                emoji: String(reaction.emoji),
            }))
            : [],
    });
};

const emitMessageEdited = async (message: any) => {
    await emitToConversationParticipants(String(message.conversationId), 'message:edited', {
        _id: String(message._id),
        content: message.content || '',
        editedAt: message.editedAt || null,
        originalContent: message.originalContent || null,
        senderId: String(message.sender),
        receiverId: message.receiver ? String(message.receiver) : null,
    });
};

const emitMessageDeleted = async (message: any) => {
    await emitToConversationParticipants(String(message.conversationId), 'message:deleted', {
        _id: String(message._id),
        content: message.content || '',
        isDeleted: Boolean(message.isDeleted),
        senderId: String(message.sender),
        receiverId: message.receiver ? String(message.receiver) : null,
    });
};

const emitMessageReacted = async (message: any) => {
    await emitToConversationParticipants(String(message.conversationId), 'message:reacted', {
        _id: String(message._id),
        senderId: String(message.sender),
        receiverId: message.receiver ? String(message.receiver) : null,
        reactions: Array.isArray(message.reactions)
            ? message.reactions.map((reaction: any) => ({
                userId: String(reaction.userId),
                emoji: String(reaction.emoji),
            }))
            : [],
    });
};

/**
 * If the receiver already has at least one live socket, treat the message as
 * delivered immediately so the sender sees ✓✓ without waiting for a reconnect.
 */
const persistMessageWithDelivery = async (message: any) => {
    const receiverId = message.receiver ? String(message.receiver) : null;
    if (receiverId && isUserOnline(receiverId)) {
        message.deliveredAt = new Date();
    }
    await message.save();
};

const getConversationForDm = async (userA: string, userB: string) => {
    const participants = [String(userA), String(userB)].sort();
    let conversation = await Conversation.findOne({
        type: ConversationType.dm,
        participants: { $all: participants, $size: 2 },
    });

    if (!conversation) {
        conversation = await Conversation.create({ type: ConversationType.dm, participants });
    }

    return conversation;
};

const getConversationByIdForParticipant = async (conversationId: string, userId: string) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
    });
    if (!conversation) {
        throw new AppError(403, 'Forbidden', 'You are not a participant of this conversation');
    }
    return conversation;
};

/**
 * Older records may miss conversationId. Before persisting any mutation,
 * ensure the message is linked to its DM conversation.
 */
const ensureMessageConversationId = async (message: any) => {
    if (message?.conversationId) return;
    const conversation = await getConversationForDm(String(message.sender), String(message.receiver));
    message.conversationId = conversation._id;
};

const createAndPersistMessage = async ({
    sender,
    receiver,
    conversationId,
    type,
    content,
    media,
    replyTo,
}: {
    sender: string;
    receiver?: string;
    conversationId?: string;
    type: MessageType;
    content?: string;
    media?: string;
    replyTo?: string;
}) => {
    let conversation: any;
    let resolvedReceiver: string | null = null;
    if (conversationId) {
        conversation = await getConversationByIdForParticipant(conversationId, sender);
        if (conversation.type === ConversationType.dm) {
            const peerId = (conversation.participants || [])
                .map((id: any) => String(id))
                .find((participantId: string) => participantId !== String(sender));
            if (!peerId) {
                throw new AppError(400, 'Invalid conversation', 'DM conversation has no peer participant');
            }
            resolvedReceiver = peerId;
        }
    } else if (receiver) {
        conversation = await getConversationForDm(sender, receiver);
        resolvedReceiver = receiver;
    } else {
        throw new AppError(400, 'Invalid request', '`receiver` or `conversationId` is required');
    }

    let replyToId: string | null = null;
    if (replyTo) {
        if (!objectIdRegex.test(replyTo)) {
            throw new AppError(400, 'Invalid request', '`replyTo` must be a valid message id');
        }
        const repliedMessage = await Message.findById(replyTo);
        if (!repliedMessage) {
            throw new AppError(404, 'Message not found', '`replyTo` message does not exist');
        }
        await ensureMessageConversationId(repliedMessage);
        if (String(repliedMessage.conversationId) !== String(conversation._id)) {
            throw new AppError(400, 'Invalid request', '`replyTo` message is outside this conversation');
        }
        replyToId = String(repliedMessage._id);
    }

    const message = new Message({
        conversationId: conversation._id,
        sender,
        receiver: resolvedReceiver,
        replyTo: replyToId,
        type,
        content,
        media,
    });

    await persistMessageWithDelivery(message);
    await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: message._id,
        updatedAt: message.createdAt ?? new Date(),
    });

    return message;
};

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const { receiver, conversationId, type, content, media, replyTo } = req.body;
    if ((!receiver && !conversationId) || !type) {
        throw new AppError(400, 'Please provide all the required fields', 'One of the fields (or more) is missing');
    }

    const message = await createAndPersistMessage({
        sender: authUserId,
        receiver: receiver ? String(receiver) : undefined,
        conversationId: conversationId ? String(conversationId) : undefined,
        type,
        content,
        media,
        replyTo,
    });
    await emitNewMessage(message);

    res.status(200).json(genericResponse(true, 'Message sent successfully', null, null, message));
});

const MESSAGES_DEFAULT_LIMIT = 50;
const MESSAGES_MAX_LIMIT = 100;

const getMessages = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const { sender, receiver, conversationId, before, limit: limitRaw } = req.query as {
        sender?: string;
        receiver?: string;
        conversationId?: string;
        before?: string;
        limit?: string;
    };

    const parsedLimit = parseInt(String(limitRaw ?? ''), 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, MESSAGES_MAX_LIMIT)
        : MESSAGES_DEFAULT_LIMIT;

    const filter: Record<string, unknown> = {};

    if (conversationId) {
        if (!objectIdRegex.test(String(conversationId))) {
            throw new AppError(400, 'Invalid conversation id', '`conversationId` must be a valid ObjectId');
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: authUserId,
        }).select('_id');

        if (!conversation) {
            throw new AppError(403, 'Forbidden', 'You are not a participant of this conversation');
        }

        filter.conversationId = conversationId;
    } else {
        if (!sender || !receiver) {
            throw new AppError(400, 'Please provide all the required fields', '`conversationId` or sender/receiver are required');
        }

        if (String(sender) !== String(authUserId) && String(receiver) !== String(authUserId)) {
            throw new AppError(403, 'Forbidden', 'You are not a participant of this conversation');
        }

        filter.$or = [
            { sender, receiver },
            { sender: receiver, receiver: sender },
        ];
    }

    if (before) {
        const beforeDate = new Date(String(before));
        if (Number.isNaN(beforeDate.getTime())) {
            throw new AppError(400, 'Invalid cursor', '`before` must be a valid ISO date string');
        }
        filter.createdAt = { $lt: beforeDate };
    }

    // Fetch one extra document to detect whether another page exists.
    const docs = await Message.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1);

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const oldest = items[items.length - 1];
    const nextCursor = hasMore && oldest?.createdAt
        ? oldest.createdAt.toISOString()
        : null;

    res.status(200).json(
        genericResponse(true, 'Messages retrieved successfully', null, null, {
            items,
            nextCursor,
            hasMore,
            limit,
        }),
    );
});

const buildMediaUrl = (file: Express.Multer.File) => {
    const folder = path.basename(file.destination || "");
    return `/uploads/${folder}/${file.filename}`;
};

const sendVoiceMessage = asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;

    try {
        const authUserId = req.user?.id;
        if (!authUserId) {
            throw new AppError(401, 'Authentication failed', 'No authenticated user');
        }

        const { receiver, conversationId, replyTo } = req.body as { receiver?: string; conversationId?: string; replyTo?: string };
        if (!receiver && !conversationId) {
            throw new AppError(400, 'Please provide all the required fields', 'receiver field is missing');
        }
        if (!file) {
            throw new AppError(400, 'No audio file uploaded', 'audio field is missing');
        }
        enforceUploadPolicy(file);

        const mediaUrl = buildMediaUrl(file);
        const message = await createAndPersistMessage({
            sender: authUserId,
            receiver: receiver ? String(receiver) : undefined,
            conversationId: conversationId ? String(conversationId) : undefined,
            type: MessageType.audio,
            content: '',
            media: mediaUrl,
            replyTo,
        });
        await emitNewMessage(message);

        res.status(200).json(genericResponse(true, 'Voice message sent successfully', null, null, message));
    } catch (err) {
        safeUnlink(file?.path);
        throw err;
    }
});

const inferMediaType = (mime: string | undefined, explicit: string | undefined): MessageType => {
    const normalized = (explicit || '').toLowerCase();
    if (normalized === 'image' || normalized === 'video' || normalized === 'file' || normalized === 'audio') {
        return normalized as MessageType;
    }
    const m = (mime || '').toLowerCase();
    if (m.startsWith('image/')) return MessageType.image;
    if (m.startsWith('video/')) return MessageType.video;
    if (m.startsWith('audio/')) return MessageType.audio;
    return MessageType.file;
};

const sendMediaMessage = asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;

    try {
        const authUserId = req.user?.id;
        if (!authUserId) {
            throw new AppError(401, 'Authentication failed', 'No authenticated user');
        }

        const { receiver, conversationId, type, content, replyTo } = req.body as {
            receiver?: string;
            conversationId?: string;
            type?: string;
            content?: string;
            replyTo?: string;
        };
        if (!receiver && !conversationId) {
            throw new AppError(400, 'Please provide all the required fields', 'receiver field is missing');
        }
        if (!file) {
            throw new AppError(400, 'No file uploaded', 'media field is missing');
        }
        enforceUploadPolicy(file);

        const resolvedType = inferMediaType(file.mimetype, type);
        const mediaUrl = buildMediaUrl(file);
        const message = await createAndPersistMessage({
            sender: authUserId,
            receiver: receiver ? String(receiver) : undefined,
            conversationId: conversationId ? String(conversationId) : undefined,
            type: resolvedType,
            content: content || file.originalname || '',
            media: mediaUrl,
            replyTo,
        });
        await emitNewMessage(message);

        res.status(200).json(genericResponse(true, 'Media message sent successfully', null, null, message));
    } catch (err) {
        safeUnlink(file?.path);
        throw err;
    }
});

const markRead = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const { peerId } = req.body as { peerId?: string };
    if (!peerId) {
        throw new AppError(400, 'Invalid request', '`peerId` is required');
    }
    if (String(peerId) === String(authUserId)) {
        throw new AppError(400, 'Invalid request', 'Cannot mark self messages as read');
    }

    const now = new Date();
    const unread = await Message.find(
        { receiver: authUserId, sender: peerId, readAt: null },
        { _id: 1 },
    ).lean();
    if (unread.length === 0) {
        return res.status(200).json(
            genericResponse(true, 'Messages marked as read successfully', null, null, { ids: [] }),
        );
    }

    const ids = unread.map((m) => String(m._id));
    await Message.updateMany(
        { _id: { $in: unread.map((m) => m._id) } },
        { $set: { readAt: now, deliveredAt: now } },
    );

    try {
        const io = getIO();
        const payload = {
            ids,
            at: now.toISOString(),
            readerId: String(authUserId),
            peerId: String(authUserId),
            senderId: String(authUserId),
        };
        io.to(String(peerId)).emit('message:read', payload);
        io.to(String(peerId)).emit('messages:status', {
            ids,
            status: 'read',
            at: payload.at,
            peerId: payload.peerId,
        });
    } catch (_) {
        // socket not ready / not initialised – safe to skip
    }

    res.status(200).json(
        genericResponse(true, 'Messages marked as read successfully', null, null, {
            ids,
            at: now.toISOString(),
        }),
    );
});

const editMessage = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const { id } = req.params as { id?: string };
    if (!id || !objectIdRegex.test(String(id))) {
        throw new AppError(400, 'Invalid request', '`id` must be a valid message id');
    }

    const { content } = req.body as { content?: string };
    const nextContent = (content || '').trim();
    if (!nextContent) {
        throw new AppError(400, 'Invalid request', '`content` is required');
    }

    const message = await Message.findById(id);
    if (!message) {
        throw new AppError(404, 'Message not found', 'Message does not exist');
    }
    if (String(message.sender) !== String(authUserId)) {
        throw new AppError(403, 'Forbidden', 'Only message owner can edit');
    }
    if (message.isDeleted) {
        throw new AppError(400, 'Invalid request', 'Cannot edit a deleted message');
    }
    if (!message.createdAt || Date.now() - message.createdAt.getTime() > MESSAGE_EDIT_WINDOW_MS) {
        throw new AppError(403, 'Edit window expired', 'Messages can only be edited within 15 minutes');
    }
    if ((message.content || '').trim() === nextContent) {
        return res.status(200).json(
            genericResponse(true, 'Message edited successfully', null, null, message),
        );
    }

    await ensureMessageConversationId(message);
    message.originalContent = message.originalContent || message.content || '';
    message.content = nextContent;
    message.editedAt = new Date();
    await message.save();

    await emitMessageEdited(message);
    return res.status(200).json(genericResponse(true, 'Message edited successfully', null, null, message));
});

const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const { id } = req.params as { id?: string };
    if (!id || !objectIdRegex.test(String(id))) {
        throw new AppError(400, 'Invalid request', '`id` must be a valid message id');
    }

    const message = await Message.findById(id);
    if (!message) {
        throw new AppError(404, 'Message not found', 'Message does not exist');
    }
    if (String(message.sender) !== String(authUserId)) {
        throw new AppError(403, 'Forbidden', 'Only message owner can delete');
    }
    if (message.isDeleted) {
        return res.status(200).json(
            genericResponse(true, 'Message deleted successfully', null, null, message),
        );
    }

    await ensureMessageConversationId(message);
    message.originalContent = message.originalContent || message.content || '';
    message.content = 'ההודעה נמחקה';
    message.isDeleted = true;
    message.editedAt = null;
    await message.save();

    await emitMessageDeleted(message);
    return res.status(200).json(genericResponse(true, 'Message deleted successfully', null, null, message));
});

const reactMessage = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }
    const { id } = req.params as { id?: string };
    if (!id || !objectIdRegex.test(String(id))) {
        throw new AppError(400, 'Invalid request', '`id` must be a valid message id');
    }
    const emoji = String((req.body as { emoji?: string })?.emoji || '').trim();
    if (!emoji) {
        throw new AppError(400, 'Invalid request', '`emoji` is required');
    }

    const message = await Message.findById(id);
    if (!message) {
        throw new AppError(404, 'Message not found', 'Message does not exist');
    }
    if (message.isDeleted) {
        throw new AppError(400, 'Invalid request', 'Cannot react to a deleted message');
    }

    const currentReactions = Array.isArray(message.reactions) ? message.reactions : [];
    const hasReaction = currentReactions.some(
        (r: any) => String(r.userId) === String(authUserId) && String(r.emoji) === emoji,
    );
    if (!hasReaction) {
        currentReactions.push({
            userId: authUserId as any,
            emoji,
        } as any);
    }
    await ensureMessageConversationId(message);
    message.reactions = currentReactions as any;
    await message.save();
    await emitMessageReacted(message);

    return res.status(200).json(genericResponse(true, 'Message reacted successfully', null, null, message));
});

const unreactMessage = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }
    const { id } = req.params as { id?: string };
    if (!id || !objectIdRegex.test(String(id))) {
        throw new AppError(400, 'Invalid request', '`id` must be a valid message id');
    }
    const emoji = String((req.body as { emoji?: string })?.emoji || '').trim();
    if (!emoji) {
        throw new AppError(400, 'Invalid request', '`emoji` is required');
    }

    const message = await Message.findById(id);
    if (!message) {
        throw new AppError(404, 'Message not found', 'Message does not exist');
    }

    message.reactions = (Array.isArray(message.reactions) ? message.reactions : []).filter(
        (r: any) => !(String(r.userId) === String(authUserId) && String(r.emoji) === emoji),
    ) as any;
    await ensureMessageConversationId(message);
    await message.save();
    await emitMessageReacted(message);

    return res.status(200).json(genericResponse(true, 'Message reaction removed successfully', null, null, message));
});

export { sendMessage, getMessages, sendVoiceMessage, sendMediaMessage, markRead, editMessage, deleteMessage, reactMessage, unreactMessage };
