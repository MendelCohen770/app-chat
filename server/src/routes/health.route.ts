import express from 'express';
import { health, ready } from '../controllers/health.controller';

const healthRoute = express.Router();

healthRoute.get('/health', health);
healthRoute.get('/ready', ready);

export default healthRoute;
