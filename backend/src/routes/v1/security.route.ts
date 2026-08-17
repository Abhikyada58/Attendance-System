import { Router } from 'express';
import { securityDashboardController } from '../../controllers/security.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// All security dashboard routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

router.get('/summary',      securityDashboardController.getSecuritySummary);
router.get('/events',       securityDashboardController.getSecurityEvents);
router.patch('/events/:id', securityDashboardController.updateSecurityEvent);
router.get('/sessions',     securityDashboardController.getAllActiveSessions);
router.get('/failed-logins', securityDashboardController.getFailedLogins);

export default router;
