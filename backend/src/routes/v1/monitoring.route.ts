import { Router } from 'express';
import { monitoringController } from '../../controllers/monitoring.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// All monitoring routes require ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

// System overview + metrics
router.get('/overview',          monitoringController.getOverview);
router.get('/metrics',           monitoringController.getMetrics);
router.get('/metrics/history',   monitoringController.getMetricHistory);

// Log search
router.get('/logs',              monitoringController.searchLogs);

// Incident management
router.get('/incidents',              monitoringController.listIncidents);
router.post('/incidents',             monitoringController.createIncident);
router.get('/incidents/:id',          monitoringController.getIncident);
router.patch('/incidents/:id',        monitoringController.updateIncident);
router.patch('/incidents/:id/status', monitoringController.updateIncidentStatus);
router.post('/incidents/:id/notes',   monitoringController.addNote);

export default router;
