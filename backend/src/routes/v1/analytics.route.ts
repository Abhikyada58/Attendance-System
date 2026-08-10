import { Router } from 'express';
import { analyticsController } from '../../controllers/analytics.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

router.use(requireAuth);

// ---------------------------------------------
// STUDENT ANALYTICS
// ---------------------------------------------
const studentRouter = Router();
studentRouter.use(requireRole('STUDENT'));

studentRouter.get('/students/me/overview', analyticsController.getStudentOverview);
studentRouter.get('/students/me/subjects', analyticsController.getStudentSubjects);
studentRouter.get('/students/me/monthly', analyticsController.getStudentMonthly);

router.use('/', studentRouter);

// ---------------------------------------------
// FACULTY ANALYTICS
// ---------------------------------------------
const facultyRouter = Router();
facultyRouter.use(requireRole('FACULTY'));

facultyRouter.get('/faculty/overview', analyticsController.getFacultyOverview);
facultyRouter.get('/faculty/classes', analyticsController.getFacultyClasses);

router.use('/', facultyRouter);

export default router;
