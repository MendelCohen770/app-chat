import { z } from 'zod';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[0-9+\-]{9,14}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'required'),
  password: z.string().min(1, 'required'),
});

export const otpRequestSchema = z.object({
  otpEmail: z.string().trim().min(1, 'required').regex(emailRegex, 'email_invalid'),
});

export const otpVerifySchema = z.object({
  otpCode: z.string().trim().min(1, 'required'),
});

export const signupSchema = z
  .object({
    username: z.string().trim().min(2, 'username_short'),
    email: z.string().trim().min(1, 'required').regex(emailRegex, 'email_invalid'),
    phone: z.string().trim().min(1, 'required').regex(phoneRegex, 'phone_invalid'),
    password: z.string().min(1, 'required'),
    confirmPassword: z.string().min(1, 'required'),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'password_mismatch',
      });
    }
  });

export const profileDetailsSchema = z.object({
  username: z.string().trim().min(2, 'username_short'),
  email: z.string().trim().min(1, 'required').regex(emailRegex, 'email_invalid'),
  phone: z.string().trim().min(1, 'required').regex(phoneRegex, 'phone_invalid'),
});

export const profilePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'required'),
    newPassword: z.string().min(1, 'required').regex(passwordRegex, 'password_weak'),
    confirmPassword: z.string().min(1, 'required'),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'password_mismatch',
      });
    }
  });
