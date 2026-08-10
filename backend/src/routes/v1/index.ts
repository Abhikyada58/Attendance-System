/**
 * V1 API Router
 * 
 * WHY THIS EXISTS:
 * Versioning APIs (v1, v2) allows us to make breaking changes in the future without
 * immediately breaking mobile apps or frontends that rely on the older version.
 */

import { Router } from 'express';
import healthRoutes from './health.route';
import authRoutes from './auth.route';
import userRoutes from './user.route';
import academicRoutes from './academic.route';
import studentRoutes from './student.route';
import adminStudentRoutes from './admin.student.route';
import facultyRoutes from './faculty.route';
import attendanceRoutes from './attendance.route';
import analyticsRoutes from './analytics.route';
import qrRoutes from './qr.route';
import faceRoutes from './face.route';
import notificationRoutes from './notification.route';
import adminRoutes from './admin.route';
import reportRoutes from './report.route';
import aiRoutes from './ai.route';
import timetableRoutes from './timetable.route';
import calendarRoutes from './calendar.route';
import scheduleRoutes from './schedule.route';
import planningRoutes from './planning.route';
import announcementRoutes from './announcement.route';
import workflowRoutes from './workflow.route';
import engagementRoutes from './engagement.route';
import supportRoutes from './support.route';

const router = Router();

// Mount all v1 feature routes here
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/academic', academicRoutes);
router.use('/students', studentRoutes);
router.use('/admin/students', adminStudentRoutes);
router.use('/faculty', facultyRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/attendance', qrRoutes); // Mount QR routes under attendance
router.use('/', faceRoutes); // Face routes have their own base paths
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/ai', aiRoutes);
router.use('/timetable', timetableRoutes);
router.use('/calendar', calendarRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/planning', planningRoutes);
router.use('/announcements', announcementRoutes);
router.use('/workflow', workflowRoutes);
router.use('/engagement', engagementRoutes);
router.use('/support', supportRoutes);

export default router;
