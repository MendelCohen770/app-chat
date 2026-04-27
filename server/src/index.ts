import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DBconnect from './DBconnect/DBconnect';
import { createApp, resolveAllowedOrigins } from './app';
import setUpSocket, { setIO } from './sockets/socket';
import { logger } from './utils/logger';
import { initSentry } from './config/sentry';

dotenv.config();
initSentry();

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
DBconnect();
const { app } = createApp(clientOrigin);
const allowedOrigins = resolveAllowedOrigins(clientOrigin);
const server = http.createServer(app);
const io = new Server(server, {
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
