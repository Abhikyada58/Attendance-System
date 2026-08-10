import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

// Route: POST /api/v1/auth/register
// Public route for student registration
router.post('/register', authController.register);

// Route: POST /api/v1/auth/login
// Public route for authentication
router.post('/login', authController.login);

// Route: GET /api/v1/auth/me
// Protected route (requires valid JWT) to get current user's profile
router.get('/me', requireAuth, authController.getMe);

export default router;
