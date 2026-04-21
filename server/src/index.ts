import express, { Application, Request, Response } from 'express';
import DBconnect from './DBconnect/DBconnect'
import dotenv from 'dotenv';
import path from 'path';
import userRoute from './routes/user.route'
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
const port = process.env.PORT || 3000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

DBconnect();
const server = http.createServer(app);
app.use(cors({
  origin: clientOrigin,
  credentials: true,
}))
const io = new Server(server,{
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  }
});
setUpSocket(io);
setIO(io);
app.use(correlationId);
app.use(httpLogger);
app.use(cookieParser());
app.use(express.json());
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
