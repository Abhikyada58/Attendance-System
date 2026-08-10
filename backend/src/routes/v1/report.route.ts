import { Router } from 'express';
import { reportController } from '../../controllers/report.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/student/export', reportController.exportStudentReport);
router.get('/faculty/export', reportController.exportFacultyReport);

export default router;
