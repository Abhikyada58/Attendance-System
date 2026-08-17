/**
 * V1 API Router
 *
 * Versioning APIs (v1, v2) allows breaking changes without breaking existing clients.
 * Module 25 adds: /privacy and /admin/security routes.
 */

import { Router } from 'express';
import healthRoutes       from './health.route';
import authRoutes         from './auth.route';
import userRoutes         from './user.route';
import academicRoutes     from './academic.route';
import studentRoutes      from './student.route';
import adminStudentRoutes from './admin.student.route';
import facultyRoutes      from './faculty.route';
import attendanceRoutes   from './attendance.route';
import analyticsRoutes    from './analytics.route';
import qrRoutes           from './qr.route';
import faceRoutes         from './face.route';
import notificationRoutes from './notification.route';
import adminRoutes        from './admin.route';
import reportRoutes       from './report.route';
import aiRoutes           from './ai.route';
import timetableRoutes    from './timetable.route';
import calendarRoutes     from './calendar.route';
import scheduleRoutes     from './schedule.route';
import planningRoutes     from './planning.route';
import announcementRoutes from './announcement.route';
import workflowRoutes     from './workflow.route';
import engagementRoutes   from './engagement.route';
import supportRoutes      from './support.route';
import privacyRoutes      from './privacy.route';   // Module 25 — Privacy
import securityRoutes     from './security.route';  // Module 25 — Security Dashboard
import monitoringRoutes   from './monitoring.route'; // Module 26 — Observability

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, '../../../../docs/swagger.yaml'));

const router = Router();

// Mount API Documentation (Module 30)
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

router.use('/health',          healthRoutes);
router.use('/auth',            authRoutes);
router.use('/users',           userRoutes);
router.use('/academic',        academicRoutes);
router.use('/students',        studentRoutes);
router.use('/admin/students',  adminStudentRoutes);
router.use('/faculty',         facultyRoutes);
router.use('/attendance',      attendanceRoutes);
router.use('/attendance',      qrRoutes);
router.use('/',                faceRoutes);
router.use('/analytics',       analyticsRoutes);
router.use('/notifications',   notificationRoutes);
router.use('/admin',           adminRoutes);
router.use('/admin/security',  securityRoutes);     // Module 25
router.use('/monitoring',      monitoringRoutes);    // Module 26
router.use('/reports',         reportRoutes);
router.use('/ai',              aiRoutes);
router.use('/timetable',       timetableRoutes);
router.use('/calendar',        calendarRoutes);
router.use('/schedule',        scheduleRoutes);
router.use('/planning',        planningRoutes);
router.use('/announcements',   announcementRoutes);
router.use('/workflow',        workflowRoutes);
router.use('/engagement',      engagementRoutes);
router.use('/support',         supportRoutes);
router.use('/privacy',         privacyRoutes);      // Module 25

export default router;
