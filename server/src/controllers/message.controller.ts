import Message, { MessageType } from "../models/message.schema";
import { getIO } from "../sockets/socket";
import { Request, Response } from "express";
import { genericResponse } from '../utils/helper';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { asyncHandler, AppError } from '../middlewares/errorHandler';
import { logger } from '../utils/logger';

const safeUnlink = (p?: string) => {
    if (!p) return;
    try { fs.unlinkSync(p); } catch (_) { /* ignore */ }
};

const emitNewMessage = (message: any) => {
    try {
        const io = getIO();
        io.to(String(message.sender))
            .to(String(message.receiver))
            .emit('newMessage', {
                _id: message._id,
                senderId: String(message.sender),
                receiverId: String(message.receiver),
                type: message.type,
                content: message.content,
                media: message.media,
                createdAt: message.createdAt,
            });
    } catch (_) {
        // socket not ready / not initialised – safe to skip
    }
};

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const { receiver, type, content, media } = req.body;
    if (!receiver || !type) {
        throw new AppError(400, 'Please provide all the required fields', 'One of the fields (or more) is missing');
    }

    const message = new Message({
        sender: authUserId,
        receiver,
        type,
        content,
        media,
    });
    await message.save();
    emitNewMessage(message);

    res.status(200).json(genericResponse(true, 'Message sent successfully', null, null, message));
});

const getMessages = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const { sender, receiver } = req.query;
    if (!sender || !receiver) {
        throw new AppError(400, 'Please provide all the required fields', 'One of the fields (or more) is missing');
    }

    if (String(sender) !== String(authUserId) && String(receiver) !== String(authUserId)) {
        throw new AppError(403, 'Forbidden', 'You are not a participant of this conversation');
    }

    const messages = await Message.find({
        $or: [
            { sender, receiver },
            { sender: receiver, receiver: sender },
        ],
    }).sort({ createdAt: -1 });

    res.status(200).json(genericResponse(true, 'Messages retrieved successfully', null, null, messages));
});

const audioUploadsDir = path.join(__dirname, '..', 'uploads', 'audio');
try {
    fs.mkdirSync(audioUploadsDir, { recursive: true });
} catch (err) {
    logger.error({ err, dir: audioUploadsDir }, 'Failed to ensure audio uploads directory');
}

const audioStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, audioUploadsDir),
    filename: (_req, file, cb) => {
        const safeBase = `voice-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = (() => {
            const original = (file.originalname || '').toLowerCase();
            if (original.endsWith('.webm')) return '.webm';
            if (original.endsWith('.ogg')) return '.ogg';
            if (original.endsWith('.mp4') || original.endsWith('.m4a')) return '.m4a';
            if (original.endsWith('.mp3')) return '.mp3';
            if (original.endsWith('.wav')) return '.wav';
            if (file.mimetype === 'audio/ogg') return '.ogg';
            if (file.mimetype === 'audio/mp4' || file.mimetype === 'audio/x-m4a') return '.m4a';
            if (file.mimetype === 'audio/mpeg') return '.mp3';
            if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/wave') return '.wav';
            return '.webm';
        })();
        cb(null, `${safeBase}${ext}`);
    },
});

export const voiceUpload = multer({
    storage: audioStorage,
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith('audio/')) {
            cb(null, true);
            return;
        }
        cb(new Error('Only audio files are allowed'));
    },
}).single('audio');

const sendVoiceMessage = asyncHandler(async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;

    try {
        const authUserId = req.user?.id;
        if (!authUserId) {
            throw new AppError(401, 'Authentication failed', 'No authenticated user');
        }

        const { receiver } = req.body;
        if (!receiver) {
            throw new AppError(400, 'Please provide all the required fields', 'receiver field is missing');
        }
        if (!file) {
            throw new AppError(400, 'No audio file uploaded', 'audio field is missing');
        }

        const mediaUrl = `/uploads/audio/${file.filename}`;
        const message = new Message({
            sender: authUserId,
            receiver,
            type: MessageType.audio,
            content: '',
            media: mediaUrl,
        });
        await message.save();
        emitNewMessage(message);

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

        const { receiver, type, content } = req.body as { receiver?: string; type?: string; content?: string };
        if (!receiver) {
            throw new AppError(400, 'Please provide all the required fields', 'receiver field is missing');
        }
        if (!file) {
            throw new AppError(400, 'No file uploaded', 'media field is missing');
        }

        const resolvedType = inferMediaType(file.mimetype, type);
        const mediaUrl = `/uploads/media/${file.filename}`;
        const message = new Message({
            sender: authUserId,
            receiver,
            type: resolvedType,
            content: content || file.originalname || '',
            media: mediaUrl,
        });
        await message.save();
        emitNewMessage(message);

        res.status(200).json(genericResponse(true, 'Media message sent successfully', null, null, message));
    } catch (err) {
        safeUnlink(file?.path);
        throw err;
    }
});

export { sendMessage, getMessages, sendVoiceMessage, sendMediaMessage };
