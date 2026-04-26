import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly displayMessage: string;
    public readonly description: string | null;

    constructor(
        statusCode: number,
        displayMessage: string,
        description: string | null = null,
    ) {
        super(displayMessage);
        this.statusCode = statusCode;
        this.displayMessage = displayMessage;
        this.description = description;
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export const asyncHandler =
    <T extends Request = Request>(
        fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
    ) =>
    (req: T, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        message: 'Not Found',
        code: 'NOT_FOUND',
    });
};

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const reqLogger = (req as Request & { log?: typeof logger }).log ?? logger;

    if (res.headersSent) {
        reqLogger.error({ err }, 'errorHandler: headers already sent, delegating');
        return next(err);
    }

    let statusCode = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let debugMessage: string | null = null;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.displayMessage;
        code = 'APP_ERROR';
        debugMessage = err.description;
    } else if (err instanceof ZodError) {
        statusCode = 400;
        message = 'Validation error';
        code = 'VALIDATION_ERROR';
        debugMessage = err.issues
            .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
            .join(', ');
    } else if (err instanceof Error) {
        const anyErr = err as Error & { status?: number; statusCode?: number; code?: string | number };
        if (typeof anyErr.statusCode === 'number') statusCode = anyErr.statusCode;
        else if (typeof anyErr.status === 'number') statusCode = anyErr.status;

        if (err.name === 'ValidationError') {
            statusCode = 400;
            message = 'Validation error';
            code = 'MONGOOSE_VALIDATION_ERROR';
        } else if (err.name === 'CastError') {
            statusCode = 400;
            message = 'Invalid identifier';
            code = 'MONGOOSE_CAST_ERROR';
        } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            statusCode = 401;
            message = 'Authentication failed';
            code = 'AUTH_ERROR';
        } else if (anyErr.code === 11000) {
            statusCode = 409;
            message = 'Duplicate value';
            code = 'MONGOOSE_DUPLICATE_KEY';
        } else if (anyErr.code === 'LIMIT_FILE_SIZE') {
            statusCode = 413;
            message = 'File too large';
            code = 'FILE_TOO_LARGE';
        }

        debugMessage = err.message || null;
    } else {
        debugMessage = typeof err === 'string' ? err : null;
    }

    const logPayload = {
        err,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        code,
    };
    if (statusCode >= 500) {
        reqLogger.error(logPayload, 'Request failed');
    } else {
        reqLogger.warn(logPayload, 'Request rejected');
    }

    const payload: { message: string; code: string; stack?: string; debug?: string } = { message, code };
    if (process.env.NODE_ENV !== 'production') {
        if (debugMessage) {
            payload.debug = debugMessage;
        }
        if (err instanceof Error && err.stack) {
            payload.stack = err.stack;
        }
    }

    res.status(statusCode).json(payload);
};
