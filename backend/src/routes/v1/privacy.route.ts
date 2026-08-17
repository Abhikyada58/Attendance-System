import { Router } from 'express';
import { privacyController } from '../../controllers/privacy.controller';
import { requireAuth } from '../../middleware/requireAuth';
import rateLimit from 'express-rate-limit';

const router = Router();

const exportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Export limit reached. Please wait 24 hours.' } },
  skip: () => process.env.NODE_ENV !== 'production',
});

router.use(requireAuth);

router.post('/export', exportLimiter, privacyController.requestExport);
router.get('/settings',  privacyController.getPrivacySettings);
router.patch('/settings', privacyController.updatePrivacySettings);

export default router;
