import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import messageRoute from './routes/message.route';
import healthRoute from './routes/health.route';
import userRoute from './routes/user.route';
import uploadsRoute from './routes/uploads.route';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { correlationId, httpLogger } from './middlewares/requestContext';

export const resolveAllowedOrigins = (clientOrigin: string): string[] => {
  const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const configuredAllowedOrigins = (process.env.CORS_ORIGIN_WHITELIST || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(
    new Set([...defaultAllowedOrigins, clientOrigin, ...configuredAllowedOrigins]),
  );
};

export const createApp = (clientOrigin: string) => {
  const app = express();
  const origins = resolveAllowedOrigins(clientOrigin);
  const socketOrigin =
    clientOrigin.startsWith('https://')
      ? clientOrigin.replace('https://', 'wss://')
      : clientOrigin.replace('http://', 'ws://');

  const generalRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
  });

  const authRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again in a minute.' },
  });

  const messageRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many messages sent, please try again in a minute.' },
  });

  app.use(
    cors((req, callback) => {
      const requestOrigin = req.header('Origin');
      const isAllowedOrigin = !!requestOrigin && origins.includes(requestOrigin);

      callback(null, {
        origin: isAllowedOrigin,
        credentials: isAllowedOrigin,
      });
    }),
  );

  app.use(correlationId);
  app.use(httpLogger);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", clientOrigin, socketOrigin],
        },
      },
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(generalRateLimiter);
  app.use('/user/login', authRateLimiter);
  app.use('/user/signUp', authRateLimiter);
  app.use('/user/otpService', authRateLimiter);
  app.use('/message/sendMessage', messageRateLimiter);
  app.use('/message/sendVoice', messageRateLimiter);
  app.use('/message/sendMedia', messageRateLimiter);
  app.use('/user', userRoute);
  app.use('/message', messageRoute);
  app.use('/', healthRoute);
  app.use('/uploads', uploadsRoute);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, origins };
};
