import { z } from 'zod';

const phoneRegex = /^[0-9+\-]{9,14}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

export const updateUserBodySchema = z.object({
    username: z.string().trim().min(2).max(40),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().regex(phoneRegex, 'Invalid phone number'),
    profileIcon: z.string().trim().min(1).optional(),
});

export const changePasswordBodySchema = z.object({
    password: z.string().min(1),
    newPassword: z.string().regex(passwordRegex, 'Password must contain upper, lower and number (min 8 chars)'),
});

export const searchUserQuerySchema = z.object({
    username: z.string().trim().min(1),
});
