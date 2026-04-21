import { Request, Response } from 'express';
import mongoose from 'mongoose';
import redis from '../service/redisClient';

const health = (req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
};

const ready = async (req: Request, res: Response) => {
    const checks: Record<string, 'ok' | 'down'> = {
        mongo: 'down',
        redis: 'down',
    };

    checks.mongo = mongoose.connection.readyState === 1 ? 'ok' : 'down';

    try {
        // const pong = await redis.ping();
        // checks.redis = pong === 'PONG' ? 'ok' : 'down';
    } catch {
        checks.redis = 'down';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');
    res.status(allOk ? 200 : 503).json({
        status: allOk ? 'ready' : 'not_ready',
        checks,
        timestamp: new Date().toISOString(),
    });
};

export { health, ready };
