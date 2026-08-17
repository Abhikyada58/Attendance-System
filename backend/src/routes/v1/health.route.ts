import { Router } from 'express';
import { fullHealthCheck, livenessCheck, readinessCheck } from '../../controllers/health.controller';

const router = Router();

// GET /health       — full health check (DB + AI + services + metrics)
router.get('/', fullHealthCheck);

// GET /health/live  — liveness: is the process running?
router.get('/live', livenessCheck);

// GET /health/ready — readiness: can the instance accept traffic?
router.get('/ready', readinessCheck);

export default router;
