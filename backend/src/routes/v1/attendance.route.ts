import { Router } from 'express';
import { attendanceController } from '../../controllers/attendance.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

router.use(requireAuth);

// ---------------------------------------------
// FACULTY ROUTES (Protected by FACULTY role)
// ---------------------------------------------
const facultyRouter = Router();
facultyRouter.use(requireRole('FACULTY'));

facultyRouter.post('/sessions', attendanceController.createSession);
facultyRouter.get('/sessions/:sessionId', attendanceController.getSession);
facultyRouter.get('/sessions/:sessionId/students', attendanceController.getSessionStudents);
facultyRouter.patch('/sessions/:sessionId/students/:studentId', attendanceController.markStudent);
facultyRouter.post('/sessions/:sessionId/records', attendanceController.bulkMarkAttendance);
facultyRouter.post('/sessions/:sessionId/close', attendanceController.closeSession);

router.use('/', facultyRouter);

// ---------------------------------------------
// STUDENT ROUTES (Protected by STUDENT role)
// ---------------------------------------------
const studentRouter = Router();
studentRouter.use(requireRole('STUDENT'));

studentRouter.get('/student/history', attendanceController.getStudentHistory);

router.use('/', studentRouter);

export default router;
