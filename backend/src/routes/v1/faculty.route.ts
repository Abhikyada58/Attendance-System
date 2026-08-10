import { Router } from 'express';
import { facultyController } from '../../controllers/faculty.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Secure all faculty routes
router.use(requireAuth);
router.use(requireRole('FACULTY'));

// Profile
router.get('/me', facultyController.getProfile);
router.patch('/me', facultyController.updateProfile);

// Assignments
router.get('/me/assignments', facultyController.getAssignments);
router.get('/me/assignments/:assignmentId', facultyController.getAssignmentDetails);

// Subjects
router.get('/me/subjects', facultyController.getSubjects);

// Classes & Students
router.get('/me/classes', facultyController.getClasses);
router.get('/me/classes/:classId/students', facultyController.getClassStudents);

export default router;
