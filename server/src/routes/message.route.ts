import express from 'express'
import { sendMessage, getMessages } from '../controllers/message.controller';


const messageRoute = express.Router();

messageRoute.post('/sendMessage', sendMessage);
messageRoute.get('/getMessages', getMessages);

export default messageRoute;