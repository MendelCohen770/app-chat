import express, { Application, Request, Response } from 'express';
import DBconnect from './DBconnect/DBconnect'
import dotenv from 'dotenv';
import path from 'path';
import userRoute from './routes/user.route'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import messageRoute from './routes/message.route';
import healthRoute from './routes/health.route';
import { Server } from 'socket.io';
import http from 'http';
import setUpSocket, { setIO } from './sockets/socket';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { correlationId, httpLogger } from './middlewares/requestContext';
import { logger } from './utils/logger';
import mongoose from 'mongoose';



const app = express();
dotenv.config();

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DB_CONNECTION', 'CLIENT_ORIGIN', 'GOOGLE_CLIENT_ID'] as const;
const MIN_JWT_SECRET_LENGTH = 15;

const validateRequiredEnv = () => {
  const missingVars = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  const jwtSecret = process.env.JWT_SECRET as string;
  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`);
  }
};

validateRequiredEnv();

const port = process.env.PORT || 3000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const configuredAllowedOrigins = (process.env.CORS_ORIGIN_WHITELIST || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, clientOrigin, ...configuredAllowedOrigins])
);
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

DBconnect();
const server = http.createServer(app);
app.use(
  cors((req, callback) => {
    const requestOrigin = req.header('Origin');
    const isAllowedOrigin = !!requestOrigin && allowedOrigins.includes(requestOrigin);

    callback(null, {
      origin: isAllowedOrigin,
      credentials: isAllowedOrigin,
    });
  })
);
const io = new Server(server,{
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Socket.IO CORS origin not allowed'));
    },
    methods: ["GET", "POST"],
    credentials: true,
  }
});
setUpSocket(io);
setIO(io);
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
  })
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(notFoundHandler);
app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
});

server.listen(port, () => {
  logger.info({ port, clientOrigin }, `Server running at http://localhost:${port}`);
});

const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10000;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    logger.warn({ signal }, 'Shutdown already in progress');
    return;
  }
  isShuttingDown = true;
  logger.info({ signal }, 'Graceful shutdown initiated');

  const forceExit = setTimeout(() => {
    logger.fatal('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    await new Promise<void>((resolve) => {
      io.close(() => {
        logger.info('Socket.IO server closed');
        resolve();
      });
    });

    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logger.error({ err }, 'Error closing HTTP server');
          return reject(err);
        }
        logger.info('HTTP server closed');
        resolve();
      });
    });

    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed');

    clearTimeout(forceExit);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during graceful shutdown');
    clearTimeout(forceExit);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
