import express from 'express'
import { sendMessage, getMessages } from '../controllers/message.controller';
import { authMiddleware } from '../middlewares/middel';


const messageRoute = express.Router();

messageRoute.post('/sendMessage', authMiddleware, sendMessage);
messageRoute.get('/getMessages', authMiddleware, getMessages);

export default messageRoute;