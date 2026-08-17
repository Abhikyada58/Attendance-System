import { Router } from 'express';
import { authController } from '../../controllers/auth.controller';
import { requireAuth } from '../../middleware/requireAuth';
import rateLimit from 'express-rate-limit';

const router = Router();

// ─── Endpoint-specific rate limits ─────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts. Please try again in 15 minutes.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many registration attempts. Please try again later.' } },
});

// ─── Public routes ──────────────────────────────────────────────────────────
router.post('/login',    loginLimiter,    authController.login);
router.post('/register', registerLimiter, authController.register);

// ─── Protected routes ───────────────────────────────────────────────────────
router.get('/me',     requireAuth, authController.getMe);
router.post('/logout', requireAuth, authController.logout);
router.post('/change-password', requireAuth, authController.changePassword);

// Session management
router.get('/sessions',              requireAuth, authController.getSessions);
router.delete('/sessions/others',    requireAuth, authController.revokeAllOtherSessions);
router.delete('/sessions/:sessionId', requireAuth, authController.revokeSession);

export default router;
