import Message, { MessageType } from "../models/message.schema";
import { getIO } from "../sockets/socket";
import { Request, Response } from "express";
import { genericResponse} from '../utils/helper';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const sendMessage = async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        const response = genericResponse(false, 'Authentication failed', null, 'No authenticated user', null);
        res.status(401).json(response);
        return;
    }

    const { receiver, type, content, media } = req.body;
    if( !receiver || !type ){
        const response =  genericResponse(false, 'Please provide all the required fields', null, 'One of the fields (or more) is missing', null);
        res.status(400).json(response);
        return;
    }
    try{
        const message = new Message({
            sender: authUserId,
            receiver,
            type,
            content,
            media
        });
        await message.save();
        try {
            const io = getIO();
            const payload = {
                _id: message._id,
                senderId: String(message.sender),
                receiverId: String(message.receiver),
                type: message.type,
                content: message.content,
                media: message.media,
                createdAt: message.createdAt,
            };
            io.to(String(message.sender)).to(String(message.receiver)).emit('newMessage', payload);
        } catch (err) {
            // If io not initialized, just skip emitting
        }
        const response = genericResponse(true, 'Message sent successfully', null, null, message);
        res.status(200).json(response);

    }catch(err){
        console.log(err);
        const response = genericResponse(false, 'Error sending message', null,  err instanceof Error ? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
}

const getMessages = async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        const response = genericResponse(false, 'Authentication failed', null, 'No authenticated user', null);
        res.status(401).json(response);
        return;
    }

    const { sender, receiver } = req.query;
    if( !sender || !receiver ){
        const response =  genericResponse(false, 'Please provide all the required fields', null, 'One of the fields (or more) is missing', null);
        res.status(400).json(response);
        return;
    }

    if (String(sender) !== String(authUserId) && String(receiver) !== String(authUserId)) {
        const response = genericResponse(false, 'Forbidden', null, 'You are not a participant of this conversation', null);
        res.status(403).json(response);
        return;
    }

    try{
        const messages = await Message.find({
            $or: [
                { sender, receiver },
                { sender: receiver, receiver: sender }
            ]
        }).sort({ createdAt: -1 });
        const response = genericResponse(true, 'Messages retrieved successfully', null, null, messages);
        res.status(200).json(response);

    }catch(err){
        console.log(err);
        const response = genericResponse(false, 'Error getting messages', null,  err instanceof Error ? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
}

const audioUploadsDir = path.join(__dirname, '..', 'uploads', 'audio');
try {
    fs.mkdirSync(audioUploadsDir, { recursive: true });
} catch (err) {
    console.error('Failed to ensure audio uploads directory:', err);
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

const sendVoiceMessage = async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        const response = genericResponse(false, 'Authentication failed', null, 'No authenticated user', null);
        res.status(401).json(response);
        return;
    }

    const { receiver } = req.body;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!receiver) {
        if (file) {
            try { fs.unlinkSync(file.path); } catch (_) {}
        }
        const response = genericResponse(false, 'Please provide all the required fields', null, 'receiver field is missing', null);
        res.status(400).json(response);
        return;
    }

    if (!file) {
        const response = genericResponse(false, 'No audio file uploaded', null, 'audio field is missing', null);
        res.status(400).json(response);
        return;
    }

    try {
        const mediaUrl = `/uploads/audio/${file.filename}`;
        const message = new Message({
            sender: authUserId,
            receiver,
            type: MessageType.audio,
            content: '',
            media: mediaUrl,
        });
        await message.save();

        try {
            const io = getIO();
            const payload = {
                _id: message._id,
                senderId: String(message.sender),
                receiverId: String(message.receiver),
                type: message.type,
                content: message.content,
                media: message.media,
                createdAt: message.createdAt,
            };
            io.to(String(message.sender)).to(String(message.receiver)).emit('newMessage', payload);
        } catch (_) {
            // socket not ready, skip
        }

        const response = genericResponse(true, 'Voice message sent successfully', null, null, message);
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        try { fs.unlinkSync(file.path); } catch (_) {}
        const response = genericResponse(false, 'Error sending voice message', null, err instanceof Error ? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
};

export { sendMessage, getMessages, sendVoiceMessage };


