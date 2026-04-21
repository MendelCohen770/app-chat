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



const app = express();
dotenv.config();
const port = process.env.PORT || 3001;
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
app.use(cookieParser());
app.use(express.json());
app.use('/user', userRoute);
app.use('/message', messageRoute);
app.use('/', healthRoute);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(notFoundHandler);
app.use(errorHandler);

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});