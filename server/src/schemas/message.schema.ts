import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const sendMessageBodySchema = z.object({
    receiver: z.string().regex(objectIdRegex, 'Invalid receiver id'),
    type: z.enum(['text', 'image', 'video', 'audio', 'file']),
    content: z.string().optional(),
    media: z.string().optional(),
});

export const sendVoiceBodySchema = z.object({
    receiver: z.string().regex(objectIdRegex, 'Invalid receiver id'),
});

export const sendMediaBodySchema = z.object({
    receiver: z.string().regex(objectIdRegex, 'Invalid receiver id'),
    type: z.enum(['image', 'video', 'audio', 'file']).optional(),
    content: z.string().optional(),
});

export const markReadBodySchema = z.object({
    peerId: z.string().regex(objectIdRegex, 'Invalid peer id'),
});
