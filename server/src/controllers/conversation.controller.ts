import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ConversationType } from '../../../shared/types/domain';
import Conversation from '../models/conversation.schema';
import { asyncHandler, AppError } from '../middlewares/errorHandler';
import { genericResponse } from '../utils/helper';

const objectIdRegex = /^[a-f\d]{24}$/i;

const ensureObjectId = (value: string, fieldName: string) => {
    if (!objectIdRegex.test(String(value))) {
        throw new AppError(400, 'Invalid request', `\`${fieldName}\` must be a valid ObjectId`);
    }
};

const getGroupForUser = async (conversationId: string, userId: string) => {
    const conversation = await Conversation.findOne({
        _id: conversationId,
        type: ConversationType.group,
        participants: userId,
    }).populate('participants', '_id username profileIcon');

    if (!conversation) {
        throw new AppError(404, 'Group not found', 'Group does not exist or access denied');
    }

    return conversation;
};

const mapConversation = (conversation: any, currentUserId: string) => {
    const participantDocs = Array.isArray(conversation.participants) ? conversation.participants : [];
    const admins = Array.isArray(conversation.admins) ? conversation.admins.map((id: any) => String(id)) : [];
    return {
        _id: String(conversation._id),
        type: conversation.type,
        name: conversation.name || null,
        avatar: conversation.avatar || null,
        participants: participantDocs.map((p: any) => ({
            _id: String(p._id),
            username: p.username || '',
            profileIcon: p.profileIcon || '',
        })),
        admins,
        isAdmin: admins.includes(String(currentUserId)),
        lastMessage: conversation.lastMessage ? {
            _id: String(conversation.lastMessage._id),
            sender: String(conversation.lastMessage.sender),
            receiver: conversation.lastMessage.receiver ? String(conversation.lastMessage.receiver) : null,
            content: conversation.lastMessage.content || '',
            type: conversation.lastMessage.type,
            createdAt: conversation.lastMessage.createdAt,
        } : null,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
    };
};

const listConversations = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const conversations = await Conversation.find({ participants: authUserId })
        .sort({ updatedAt: -1, _id: -1 })
        .populate('participants', '_id username profileIcon')
        .populate('lastMessage', '_id sender receiver content type createdAt');

    const data = conversations.map((conversation) => mapConversation(conversation, authUserId));
    res.status(200).json(genericResponse(true, 'Conversations retrieved successfully', null, null, data));
});

const createGroup = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const { name, avatar, participantIds } = req.body as {
        name: string;
        avatar?: string;
        participantIds: string[];
    };
    const normalizedParticipants = Array.from(new Set([authUserId, ...participantIds.map(String)]));

    const conversation = await Conversation.create({
        type: ConversationType.group,
        name: name.trim(),
        avatar: avatar?.trim() || null,
        participants: normalizedParticipants,
        admins: [new mongoose.Types.ObjectId(authUserId)],
    });
    await conversation.populate('participants', '_id username profileIcon');

    res.status(201).json(
        genericResponse(true, 'Group created successfully', null, null, mapConversation(conversation, authUserId)),
    );
});

const updateGroup = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }

    const { id } = req.params as { id: string };
    ensureObjectId(id, 'id');
    const group: any = await getGroupForUser(id, authUserId);
    const adminIds = (group.admins || []).map((adminId: mongoose.Types.ObjectId | string) => String(adminId));
    if (!adminIds.includes(authUserId)) {
        throw new AppError(403, 'Forbidden', 'Only group admins can update group details');
    }

    const { name, avatar } = req.body as { name?: string; avatar?: string };
    if (typeof name === 'string') group.name = name.trim();
    if (typeof avatar === 'string') group.avatar = avatar.trim();
    await group.save();

    res.status(200).json(genericResponse(true, 'Group updated successfully', null, null, mapConversation(group, authUserId)));
});

const addGroupMembers = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }
    const { id } = req.params as { id: string };
    ensureObjectId(id, 'id');

    const group: any = await getGroupForUser(id, authUserId);
    const adminIds = (group.admins || []).map((adminId: mongoose.Types.ObjectId | string) => String(adminId));
    if (!adminIds.includes(authUserId)) {
        throw new AppError(403, 'Forbidden', 'Only group admins can add members');
    }

    const { participantIds } = req.body as { participantIds: string[] };
    const nextParticipants = new Set<string>((group.participants || []).map((id: any) => String((id as any)._id || id)));
    participantIds.forEach((memberId) => nextParticipants.add(String(memberId)));
    group.participants = Array.from(nextParticipants).map((memberId: string) => new mongoose.Types.ObjectId(memberId)) as any;
    await group.save();
    await group.populate('participants', '_id username profileIcon');

    res.status(200).json(genericResponse(true, 'Members added successfully', null, null, mapConversation(group, authUserId)));
});

const removeGroupMember = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }
    const { id, memberId } = req.params as { id: string; memberId: string };
    ensureObjectId(id, 'id');
    ensureObjectId(memberId, 'memberId');

    const group: any = await getGroupForUser(id, authUserId);
    const adminIds = (group.admins || []).map((adminId: mongoose.Types.ObjectId | string) => String(adminId));
    const isAdmin = adminIds.includes(authUserId);
    const isSelfRemoval = authUserId === memberId;
    if (!isAdmin && !isSelfRemoval) {
        throw new AppError(403, 'Forbidden', 'Only admins can remove other members');
    }

    const participantIds = (group.participants || []).map((id: any) => String((id as any)._id || id));
    if (!participantIds.includes(memberId)) {
        throw new AppError(404, 'Member not found', 'User is not a member of this group');
    }
    const nextParticipants = participantIds.filter((idValue: string) => idValue !== memberId);
    if (nextParticipants.length < 2) {
        throw new AppError(400, 'Invalid request', 'Group must contain at least two participants');
    }

    group.participants = nextParticipants.map((idValue: string) => new mongoose.Types.ObjectId(idValue)) as any;
    const nextAdmins = adminIds.filter((adminId: string) => adminId !== memberId && nextParticipants.includes(adminId));
    group.admins = (nextAdmins.length > 0 ? nextAdmins : [nextParticipants[0]]).map(
        (idValue: string) => new mongoose.Types.ObjectId(idValue),
    ) as any;
    await group.save();
    await group.populate('participants', '_id username profileIcon');

    res.status(200).json(genericResponse(true, 'Member removed successfully', null, null, mapConversation(group, authUserId)));
});

const getGroupDetails = asyncHandler(async (req: Request, res: Response) => {
    const authUserId = req.user?.id;
    if (!authUserId) {
        throw new AppError(401, 'Authentication failed', 'No authenticated user');
    }
    const { id } = req.params as { id: string };
    ensureObjectId(id, 'id');
    const group: any = await getGroupForUser(id, authUserId);
    res.status(200).json(genericResponse(true, 'Group details retrieved successfully', null, null, mapConversation(group, authUserId)));
});

export { listConversations, createGroup, updateGroup, addGroupMembers, removeGroupMember, getGroupDetails };
