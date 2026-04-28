import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const sendMessageBodySchema = z.object({
    receiver: z.string().regex(objectIdRegex, 'Invalid receiver id'),
    type: z.enum(['text', 'image', 'video', 'audio', 'file']),
    content: z.string().optional(),
    media: z.string().optional(),
    replyTo: z.string().regex(objectIdRegex, 'Invalid reply message id').optional(),
});

export const sendVoiceBodySchema = z.object({
    receiver: z.string().regex(objectIdRegex, 'Invalid receiver id'),
    replyTo: z.string().regex(objectIdRegex, 'Invalid reply message id').optional(),
});

export const sendMediaBodySchema = z.object({
    receiver: z.string().regex(objectIdRegex, 'Invalid receiver id'),
    type: z.enum(['image', 'video', 'audio', 'file']).optional(),
    content: z.string().optional(),
    replyTo: z.string().regex(objectIdRegex, 'Invalid reply message id').optional(),
});

export const markReadBodySchema = z.object({
    peerId: z.string().regex(objectIdRegex, 'Invalid peer id'),
});

export const editMessageBodySchema = z.object({
    content: z.string().trim().min(1, 'Content is required').max(4000, 'Content is too long'),
});

export const reactMessageBodySchema = z.object({
    emoji: z.string().trim().min(1, 'Emoji is required').max(16, 'Emoji is too long'),
});
