import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createGroupBodySchema = z.object({
    name: z.string().trim().min(2, 'Group name is too short').max(80, 'Group name is too long'),
    avatar: z.string().trim().optional(),
    participantIds: z.array(z.string().regex(objectIdRegex, 'Invalid participant id')).min(1, 'At least one member is required'),
});

export const updateGroupBodySchema = z.object({
    name: z.string().trim().min(2, 'Group name is too short').max(80, 'Group name is too long').optional(),
    avatar: z.string().trim().optional(),
}).refine(
    (value) => typeof value.name === 'string' || typeof value.avatar === 'string',
    { message: 'At least one field is required' },
);

export const addGroupMembersBodySchema = z.object({
    participantIds: z.array(z.string().regex(objectIdRegex, 'Invalid participant id')).min(1, 'At least one member is required'),
});
