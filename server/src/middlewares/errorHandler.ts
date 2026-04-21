import { Request, Response, NextFunction } from 'express';
import { genericResponse } from '../utils/helper';
import { logger } from '../utils/logger';

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
    const response = genericResponse(
        false,
        'Route not found',
        `Cannot ${req.method} ${req.originalUrl}`,
        'NOT_FOUND',
        null,
    );
    res.status(404).json(response);
};

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
) => {
    const reqLogger = (req as Request & { log?: typeof logger }).log ?? logger;

    if (res.headersSent) {
        reqLogger.error({ err }, 'errorHandler: headers already sent, delegating');
        return;
    }

    let statusCode = 500;
    let displayMessage = 'Internal server error';
    let description: string | null = null;
    let exception: string | null = null;

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        displayMessage = err.displayMessage;
        description = err.description;
        exception = null;
    } else if (err instanceof Error) {
        const anyErr = err as Error & { status?: number; statusCode?: number; code?: string };
        if (typeof anyErr.statusCode === 'number') statusCode = anyErr.statusCode;
        else if (typeof anyErr.status === 'number') statusCode = anyErr.status;

        if (err.name === 'ValidationError') {
            statusCode = 400;
            displayMessage = 'Validation error';
        } else if (err.name === 'CastError') {
            statusCode = 400;
            displayMessage = 'Invalid identifier';
        } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            statusCode = 401;
            displayMessage = 'Authentication failed';
        } else if (anyErr.code === 'LIMIT_FILE_SIZE') {
            statusCode = 413;
            displayMessage = 'File too large';
        }

        description = err.message || null;
        exception = err.name;
    } else {
        exception = 'UnknownError';
        description = typeof err === 'string' ? err : null;
    }

    const logPayload = {
        err,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        exception,
    };
    if (statusCode >= 500) {
        reqLogger.error(logPayload, 'Request failed');
    } else {
        reqLogger.warn(logPayload, 'Request rejected');
    }

    const payload = genericResponse(
        false,
        displayMessage,
        description,
        exception,
        null,
    );

    res.status(statusCode).json(payload);
};
