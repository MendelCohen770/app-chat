import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import pinoHttp from 'pino-http';
import { logger, runWithLogContext, setLogContext } from '../utils/logger';

const CORRELATION_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';

const readIncomingId = (req: Request): string | undefined => {
    const fromCorr = req.headers[CORRELATION_HEADER];
    if (typeof fromCorr === 'string' && fromCorr.trim()) return fromCorr.trim();
    const fromReq = req.headers[REQUEST_ID_HEADER];
    if (typeof fromReq === 'string' && fromReq.trim()) return fromReq.trim();
    return undefined;
};

export const correlationId = (req: Request, res: Response, next: NextFunction) => {
    const id = readIncomingId(req) || randomUUID();
    res.setHeader(CORRELATION_HEADER, id);
    runWithLogContext({ correlationId: id }, () => next());
};

export const httpLogger = pinoHttp({
    logger,
    genReqId: (req, res) => {
        const incoming = readIncomingId(req as Request);
        const id = incoming || randomUUID();
        res.setHeader(CORRELATION_HEADER, id);
        return id;
    },
    customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    },
    customSuccessMessage: (req, res) =>
        `${req.method} ${req.url} -> ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
        `${req.method} ${req.url} -> ${res.statusCode} (${err?.message || 'error'})`,
    customProps: (req) => {
        const userId = (req as Request).user?.id;
        return userId ? { userId } : {};
    },
    serializers: {
        req(req) {
            return {
                id: req.id,
                method: req.method,
                url: req.url,
                remoteAddress: req.remoteAddress,
            };
        },
        res(res) {
            return { statusCode: res.statusCode };
        },
    },
});

export const attachUserToLogContext = (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    if (req.user?.id) {
        setLogContext({ userId: String(req.user.id) });
    }
    next();
};
