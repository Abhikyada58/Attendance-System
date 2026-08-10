import { Router } from 'express';
import { faceController } from '../../controllers/face.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

router.use(requireAuth);

// ---------------------------------------------
// STUDENT ROUTES
// ---------------------------------------------
const studentRouter = Router();
studentRouter.use(requireRole('STUDENT'));

studentRouter.post('/face/enroll', faceController.enrollFace);
studentRouter.post('/attendance/face/verify', faceController.verifyAttendance);

router.use('/', studentRouter);

export default router;
