import express from 'express'
import { sendMessage, getMessages, sendVoiceMessage, voiceUpload } from '../controllers/message.controller';
import { authMiddleware } from '../middlewares/middel';


const messageRoute = express.Router();

messageRoute.post('/sendMessage', authMiddleware, sendMessage);
messageRoute.get('/getMessages', authMiddleware, getMessages);
messageRoute.post('/sendVoice', authMiddleware, voiceUpload, sendVoiceMessage);

export default messageRoute;