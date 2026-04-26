import { z } from 'zod';

const phoneRegex = /^[0-9+\-]{9,14}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

export const signUpBodySchema = z.object({
    username: z.string().trim().min(2).max(40),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().regex(passwordRegex, 'Password must contain upper, lower and number (min 8 chars)'),
    phone: z.string().regex(phoneRegex, 'Invalid phone number'),
});

export const loginBodySchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(1),
});

export const verifyOtpBodySchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    otp: z.string().trim().length(6),
});

export const googleLoginBodySchema = z.object({
    credential: z.string().trim().min(1),
});
