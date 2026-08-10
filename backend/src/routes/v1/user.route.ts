import { Router } from 'express';
import { userController } from '../../controllers/user.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// ---------------------------------------------------------
// PROTECTED PROFILE ROUTES (Any authenticated, non-suspended user)
// ---------------------------------------------------------
router.use(requireAuth); // Protect all routes below

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);


// ---------------------------------------------------------
// ADMIN ROUTES
// ---------------------------------------------------------
// Apply requireRole middleware specifically for ADMIN operations
const adminOnly = requireRole('ADMIN');

router.get('/', adminOnly, userController.listUsers);
router.patch('/:id/status', adminOnly, userController.updateStatus);


// ---------------------------------------------------------
// ROLE TEST ENDPOINTS
// ---------------------------------------------------------
router.get('/admin/test', adminOnly, userController.adminTest);
router.get('/faculty/test', requireRole('FACULTY'), userController.facultyTest);
router.get('/student/test', requireRole('STUDENT'), userController.studentTest);

export default router;
