import { NextFunction, Request, Response } from 'express';
import { ZodType, z } from 'zod';
import { AppError } from './errorHandler';

const formatZodIssues = (issues: z.ZodIssue[]) =>
    issues
        .map((issue) => {
            const path = issue.path.length ? issue.path.join('.') : 'body';
            return `${path}: ${issue.message}`;
        })
        .join(', ');

export const validateBody =
    <T>(schema: ZodType<T>) =>
    (req: Request, _res: Response, next: NextFunction) => {
        const parsed = schema.safeParse(req.body);

        if (!parsed.success) {
            return next(new AppError(400, 'Validation error', formatZodIssues(parsed.error.issues)));
        }

        req.body = parsed.data as Request['body'];
        next();
    };

export const validateQuery =
    <T>(schema: ZodType<T>) =>
    (req: Request, _res: Response, next: NextFunction) => {
        const parsed = schema.safeParse(req.query);

        if (!parsed.success) {
            return next(new AppError(400, 'Validation error', formatZodIssues(parsed.error.issues)));
        }

        req.query = parsed.data as Request['query'];
        next();
    };
