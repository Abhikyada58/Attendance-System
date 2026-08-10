import { Router } from 'express';
import { studentController } from '../../controllers/student.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Secure all admin student routes
router.use(requireAuth);
router.use(requireRole('ADMIN'));

// Admin Academic Assignment
router.patch('/:id/academic', studentController.adminAssignAcademic);

// Note: General user management like /status is handled in user.route.ts
// This namespace is strictly for admin operations on the Student model layer.

export default router;
