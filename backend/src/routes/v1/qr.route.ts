import { Router } from 'express';
import { qrController } from '../../controllers/qr.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

router.use(requireAuth);

// ---------------------------------------------
// FACULTY ROUTES (Protected by FACULTY role)
// ---------------------------------------------
const facultyRouter = Router();
facultyRouter.use(requireRole('FACULTY'));

facultyRouter.post('/sessions/:sessionId/qr', qrController.generateToken);
facultyRouter.post('/sessions/:sessionId/qr/revoke', qrController.revokeToken);
facultyRouter.get('/sessions/:sessionId/qr/status', qrController.getStatus);

router.use('/', facultyRouter);

// ---------------------------------------------
// STUDENT ROUTES (Protected by STUDENT role)
// ---------------------------------------------
const studentRouter = Router();
studentRouter.use(requireRole('STUDENT'));

studentRouter.post('/qr/scan', qrController.scanToken);

router.use('/', studentRouter);

export default router;
