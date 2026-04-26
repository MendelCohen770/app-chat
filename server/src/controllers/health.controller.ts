import { Request, Response } from 'express';
import mongoose from 'mongoose';

const health = (req: Request, res: Response) => {
    const isMongoConnected = mongoose.connection.readyState === 1;

    res.status(200).json({
        status: 'ok',
        checks: {
            db: isMongoConnected ? 'up' : 'down',
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
};

const ready = (req: Request, res: Response) => {
    const isMongoConnected = mongoose.connection.readyState === 1;

    res.status(isMongoConnected ? 200 : 503).json({
        status: isMongoConnected ? 'ready' : 'not_ready',
        checks: {
            db: isMongoConnected ? 'up' : 'down',
        },
        server: 'up',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
};

export { health, ready };
