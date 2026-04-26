import express from 'express'
import { sendMessage, getMessages, sendVoiceMessage, voiceUpload, sendMediaMessage } from '../controllers/message.controller';
import { authMiddleware } from '../middlewares/middel';
import { chatMediaUpload } from '../middlewares/upload';
import { validateBody } from '../middlewares/validate.middleware';
import { sendMediaBodySchema, sendMessageBodySchema, sendVoiceBodySchema } from '../schemas';


const messageRoute = express.Router();

messageRoute.post('/sendMessage', authMiddleware, validateBody(sendMessageBodySchema), sendMessage);
messageRoute.get('/getMessages', authMiddleware, getMessages);
messageRoute.post('/sendVoice', authMiddleware, voiceUpload, validateBody(sendVoiceBodySchema), sendVoiceMessage);
messageRoute.post('/sendMedia', authMiddleware, chatMediaUpload, validateBody(sendMediaBodySchema), sendMediaMessage);

export default messageRoute;