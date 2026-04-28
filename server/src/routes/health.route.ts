import express from 'express';
import { health, ready } from '../controllers/health.controller';

const healthRoute = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is healthy
 */
healthRoute.get('/health', health);
/**
 * @openapi
 * /ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness check endpoint
 *     responses:
 *       200:
 *         description: Server is ready to receive traffic
 */
healthRoute.get('/ready', ready);

export default healthRoute;
