import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { prisma } from '../../utils/prisma';
import { startOfDay, endOfDay } from 'date-fns';

const router = Router();

router.use(requireAuth);

// Get student's upcoming classes
router.get('/student/upcoming', async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: (req.user as any)!.id } });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const classes = await prisma.scheduledClass.findMany({
      where: {
        timetable: {
          teachingAssignment: { classId: student.classId! }
        },
        startTime: { gte: new Date() },
        status: 'SCHEDULED'
      },
      include: {
        timetable: {
          include: {
            teachingAssignment: {
              include: { subject: true, faculty: { include: { user: true } } }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' },
      take: 10
    });
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

// Get faculty's today's schedule
router.get('/faculty/today', async (req, res, next) => {
  try {
    const faculty = await prisma.faculty.findUnique({ where: { userId: (req.user as any)!.id } });
    if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' });

    const today = new Date();
    
    const classes = await prisma.scheduledClass.findMany({
      where: {
        timetable: {
          teachingAssignment: { facultyId: faculty.id }
        },
        date: { gte: startOfDay(today), lte: endOfDay(today) }
      },
      include: {
        timetable: {
          include: {
            teachingAssignment: {
              include: { subject: true, class: true }
            }
          }
        },
        attendanceSession: true
      },
      orderBy: { startTime: 'asc' }
    });
    res.json(classes);
  } catch (error) {
    next(error);
  }
});

export default router;
