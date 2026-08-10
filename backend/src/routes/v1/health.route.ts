import { Router } from 'express';
import { checkHealth } from '../../controllers/health.controller';

const router = Router();

// Used for Docker Healthchecks and Uptime monitoring
router.get('/', checkHealth);
router.get('/ready', checkHealth); // In a larger system, readiness might check external services (Redis, etc.)

export default router;
