import { Router } from 'express';
import { notificationController } from '../../controllers/notification.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', notificationController.updatePreferences);

export default router;
