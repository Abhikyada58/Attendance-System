import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { engagementService } from '../../services/engagement.service';
import { prisma } from '../../utils/prisma';

const router = Router();
router.use(requireAuth);
router.use(requireRole('STUDENT'));

// Internal utility to ensure achievements are seeded (could be moved to app startup)
router.use(async (req, res, next) => {
  await engagementService.seedAchievements();
  next();
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ 
      where: { userId: (req.user as any)!.id },
      select: { id: true, engagementScore: true }
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const [streak, goals, achievements] = await Promise.all([
      engagementService.calculateStreak(student.id),
      engagementService.getMyGoals(student.id),
      engagementService.getMyAchievements(student.id)
    ]);

    // Async evaluation for unlocked achievements without blocking the request
    engagementService.evaluateAchievements(student.id).catch(console.error);

    res.json({
      score: student.engagementScore,
      streak,
      goals,
      achievements
    });
  } catch (error) {
    next(error);
  }
});

router.post('/goals/feasibility', async (req, res, next) => {
  try {
    const { subjectId, targetPercentage } = req.body;
    const student = await prisma.student.findUnique({ where: { userId: (req.user as any)!.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const feasibility = await engagementService.calculateFeasibility(student.id, subjectId, targetPercentage);
    res.json(feasibility);
  } catch (error) {
    next(error);
  }
});

router.post('/goals', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: (req.user as any)!.id } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const goal = await engagementService.createGoal({
      ...req.body,
      studentId: student.id
    });
    res.status(201).json(goal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
