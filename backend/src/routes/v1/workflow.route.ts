import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { workflowService } from '../../services/workflow.service';
import { prisma } from '../../utils/prisma';

const router = Router();
router.use(requireAuth);

// ==========================================
// STUDENT ENDPOINTS
// ==========================================

router.post('/leave', requireRole('STUDENT'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: (req.user as any)!.id } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const request = await workflowService.createLeaveRequest({
      ...req.body,
      studentId: student.id,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate)
    });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

router.post('/correction', requireRole('STUDENT'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: (req.user as any)!.id } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const request = await workflowService.createCorrectionRequest({
      ...req.body,
      studentId: student.id
    });
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

router.get('/my-requests', requireRole('STUDENT'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: (req.user as any)!.id } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const [leaves, corrections] = await Promise.all([
      workflowService.getLeaveRequests({ studentId: student.id }),
      workflowService.getCorrectionRequests({ studentId: student.id })
    ]);

    res.json({ leaves, corrections });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// REVIEWER ENDPOINTS (FACULTY / ADMIN)
// ==========================================

router.get('/pending', requireRole('FACULTY', 'ADMIN'), async (req, res, next) => {
  try {
    // Ideally, faculty only see their students' requests, but for MVP we will return all or filter by query
    const [leaves, corrections] = await Promise.all([
      workflowService.getLeaveRequests({ status: 'PENDING' }),
      workflowService.getCorrectionRequests({ status: 'PENDING' })
    ]);
    res.json({ leaves, corrections });
  } catch (error) {
    next(error);
  }
});

router.post('/leave/:id/process', requireRole('FACULTY', 'ADMIN'), async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    const request = await workflowService.processLeaveRequest(req.params.id, (req.user as any)!.id, status, comment);
    res.json(request);
  } catch (error) {
    next(error);
  }
});

router.post('/correction/:id/process', requireRole('FACULTY', 'ADMIN'), async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    const request = await workflowService.processCorrectionRequest(req.params.id, (req.user as any)!.id, status, comment);
    res.json(request);
  } catch (error) {
    next(error);
  }
});

export default router;
