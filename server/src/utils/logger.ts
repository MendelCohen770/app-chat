import { AsyncLocalStorage } from 'node:async_hooks';
import pino, { Logger } from 'pino';

export type LogContext = {
    correlationId?: string;
    userId?: string;
    socketId?: string;
};

const als = new AsyncLocalStorage<LogContext>();

export const getLogContext = (): LogContext | undefined => als.getStore();

export const runWithLogContext = <T>(ctx: LogContext, fn: () => T): T =>
    als.run({ ...ctx }, fn);

export const setLogContext = (patch: Partial<LogContext>) => {
    const store = als.getStore();
    if (store) Object.assign(store, patch);
};

const isProd = process.env.NODE_ENV === 'production';
const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

const redactPaths = [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.body.password',
    'req.body.newPassword',
    'req.body.oldPassword',
    'req.body.otp',
    'req.body.token',
    '*.password',
    '*.token',
    '*.otp',
];

export const logger: Logger = pino({
    level,
    base: {
        service: process.env.SERVICE_NAME || 'app-chat-server',
        env: process.env.NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: redactPaths, censor: '[REDACTED]' },
    mixin() {
        const ctx = als.getStore();
        if (!ctx) return {};
        const { correlationId, userId, socketId } = ctx;
        return {
            ...(correlationId ? { correlationId } : {}),
            ...(userId ? { userId } : {}),
            ...(socketId ? { socketId } : {}),
        };
    },
    ...(isProd
        ? {}
        : {
              transport: {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'SYS:HH:MM:ss.l',
                      ignore: 'pid,hostname,service,env',
                      singleLine: false,
                  },
              },
          }),
});

export default logger;
