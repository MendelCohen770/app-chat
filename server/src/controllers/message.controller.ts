import Message from "../models/message.schema";
import { Request, Response } from "express";
import { genericResponse} from '../utils/helper';

const sendMessage = async (req: Request, res: Response) => {
    const { sender, receiver, type, content, media } = req.body;
    if( !sender || !receiver || !type ){
        const response =  genericResponse(false, 'Please provide all the required fields', null, 'One of the fields (or more) is missing', null);
        res.status(400).json(response);
        return;
    }
    try{
        const message = new Message({
            sender,
            receiver,
            type,
            content,
            media
        });
        await message.save();
        const response = genericResponse(true, 'Message sent successfully', null, null, message);
        res.status(200).json(response);

    }catch(err){
        console.log(err);
        const response = genericResponse(false, 'Error sending message', null,  err instanceof Error ? err.message : 'Unknown error', null);
        res.status(500).json(response);
    }
}

const getMessages = async (req: Request, res: Response) => {
    const { sender, receiver} = req.query;
    if( !sender || !receiver ){
        const response =  genericResponse(false, 'Please provide all the required fields', null, 'One of the fields (or more) is missing', null);
        res.status(400).json(response);
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


