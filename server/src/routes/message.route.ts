import express from 'express'
import { sendMessage, getMessages, sendVoiceMessage, voiceUpload, sendMediaMessage } from '../controllers/message.controller';
import { authMiddleware } from '../middlewares/middel';
import { chatMediaUpload } from '../middlewares/upload';


const messageRoute = express.Router();

messageRoute.post('/sendMessage', authMiddleware, sendMessage);
messageRoute.get('/getMessages', authMiddleware, getMessages);
messageRoute.post('/sendVoice', authMiddleware, voiceUpload, sendVoiceMessage);
messageRoute.post('/sendMedia', authMiddleware, chatMediaUpload, sendMediaMessage);

export default messageRoute;