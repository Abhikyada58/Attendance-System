import { Router } from 'express';
import { aiController } from '../../controllers/ai.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

router.use(requireAuth);

// Student Insights
router.get(
  '/predict/student/me',
  requireRole('STUDENT'),
  aiController.getStudentInsights
);

// Faculty Insights
router.get(
  '/predict/faculty/me',
  requireRole('FACULTY'),
  aiController.getFacultyInsights
);

// Admin Insights
router.get(
  '/predict/admin',
  requireRole('ADMIN'),
  aiController.getAdminInsights
);

export default router;
