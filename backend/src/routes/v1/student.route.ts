import { Router } from 'express';
import { studentController } from '../../controllers/student.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Secure all student routes
router.use(requireAuth);
router.use(requireRole('STUDENT'));

// Student Profile endpoints
router.get('/me', studentController.getProfile);
router.patch('/me', studentController.updateProfile);

// Student Subject endpoints
router.get('/me/subjects', studentController.getSubjects);
router.get('/me/subjects/:subjectId', studentController.getSubjectDetails);

export default router;
