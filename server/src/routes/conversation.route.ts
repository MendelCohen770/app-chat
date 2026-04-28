import express from 'express';
import { authMiddleware } from '../middlewares/middel';
import { validateBody } from '../middlewares/validate.middleware';
import {
    addGroupMembersBodySchema,
    createGroupBodySchema,
    updateGroupBodySchema,
} from '../schemas';
import {
    addGroupMembers,
    createGroup,
    getGroupDetails,
    listConversations,
    removeGroupMember,
    updateGroup,
} from '../controllers/conversation.controller';

const conversationRoute = express.Router();

conversationRoute.get('/list', authMiddleware, listConversations);
conversationRoute.post('/groups', authMiddleware, validateBody(createGroupBodySchema), createGroup);
conversationRoute.get('/groups/:id', authMiddleware, getGroupDetails);
conversationRoute.patch('/groups/:id', authMiddleware, validateBody(updateGroupBodySchema), updateGroup);
conversationRoute.post('/groups/:id/members', authMiddleware, validateBody(addGroupMembersBodySchema), addGroupMembers);
conversationRoute.delete('/groups/:id/members/:memberId', authMiddleware, removeGroupMember);

export default conversationRoute;
