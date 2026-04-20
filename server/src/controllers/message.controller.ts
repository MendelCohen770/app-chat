import Message from "../models/message.schema";
import { getIO } from "../sockets/socket";
import { Request, Response } from "express";
import { genericResponse} from '../utils/helper';

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

export { sendMessage, getMessages };


