import express from 'express'
import { sendMessage, getMessages, sendVoiceMessage, sendMediaMessage, markRead, editMessage, deleteMessage, reactMessage, unreactMessage } from '../controllers/message.controller';
import { authMiddleware } from '../middlewares/middel';
import { chatMediaUpload, voiceUpload } from '../middlewares/upload';
import { validateBody } from '../middlewares/validate.middleware';
import { editMessageBodySchema, markReadBodySchema, reactMessageBodySchema, sendMediaBodySchema, sendMessageBodySchema, sendVoiceBodySchema } from '../schemas';


const messageRoute = express.Router();

/**
 * @openapi
 * /message/sendMessage:
 *   post:
 *     tags:
 *       - Message
 *     summary: Send a text message
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
messageRoute.post('/sendMessage', authMiddleware, validateBody(sendMessageBodySchema), sendMessage);
/**
 * @openapi
 * /message/getMessages:
 *   get:
 *     tags:
 *       - Message
 *     summary: Get conversation messages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
messageRoute.get('/getMessages', authMiddleware, getMessages);
/**
 * @openapi
 * /message/sendVoice:
 *   post:
 *     tags:
 *       - Message
 *     summary: Send a voice message
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Voice message sent successfully
 */
messageRoute.post('/sendVoice', authMiddleware, voiceUpload, validateBody(sendVoiceBodySchema), sendVoiceMessage);
/**
 * @openapi
 * /message/sendMedia:
 *   post:
 *     tags:
 *       - Message
 *     summary: Send a media message
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Media message sent successfully
 */
messageRoute.post('/sendMedia', authMiddleware, chatMediaUpload, validateBody(sendMediaBodySchema), sendMediaMessage);
/**
 * @openapi
 * /message/markRead:
 *   patch:
 *     tags:
 *       - Message
 *     summary: Mark conversation messages as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 */
messageRoute.patch('/markRead', authMiddleware, validateBody(markReadBodySchema), markRead);
/**
 * @openapi
 * /message/{id}:
 *   patch:
 *     tags:
 *       - Message
 *     summary: Edit a message (owner only, within 15 minutes)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message edited successfully
 */
messageRoute.patch('/:id', authMiddleware, validateBody(editMessageBodySchema), editMessage);
/**
 * @openapi
 * /message/{id}:
 *   delete:
 *     tags:
 *       - Message
 *     summary: Soft delete a message (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 */
messageRoute.delete('/:id', authMiddleware, deleteMessage);
/**
 * @openapi
 * /message/{id}/react:
 *   post:
 *     tags:
 *       - Message
 *     summary: Add reaction to a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message reacted successfully
 */
messageRoute.post('/:id/react', authMiddleware, validateBody(reactMessageBodySchema), reactMessage);
/**
 * @openapi
 * /message/{id}/react:
 *   delete:
 *     tags:
 *       - Message
 *     summary: Remove reaction from a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message reaction removed successfully
 */
messageRoute.delete('/:id/react', authMiddleware, validateBody(reactMessageBodySchema), unreactMessage);

export default messageRoute;