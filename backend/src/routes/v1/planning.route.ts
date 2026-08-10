import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { prisma } from '../../utils/prisma';
import { planningService } from '../../services/planning.service';

const router = Router();

router.use(requireAuth);

router.get('/student/metrics', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: (req.user as any)!.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Get all teaching assignments for the student's class
    const assignments = await prisma.teachingAssignment.findMany({
      where: { classId: student.classId! },
      include: { subject: true }
    });

    const metrics = await Promise.all(
      assignments.map(async (assignment) => {
        const planningData = await planningService.getStudentPlanningMetrics(student.id, assignment.id);
        return {
          subject: assignment.subject,
          ...planningData
        };
      })
    );

    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

export default router;
