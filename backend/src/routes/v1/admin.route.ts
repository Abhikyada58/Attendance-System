import { Router } from 'express';
import { adminController } from '../../controllers/admin.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// ALL admin routes require Auth + ADMIN role
router.use(requireAuth);
router.use(requireRole('ADMIN'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.setUserStatus);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// Settings & Configuration
router.get('/settings', adminController.getSettings);
router.put('/settings/:key', adminController.updateSetting);
router.put('/feature-flags/:key', adminController.updateFeatureFlag);

export default router;
