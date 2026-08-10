import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { timetableService } from '../../services/timetable.service';
import { scheduleService } from '../../services/schedule.service';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { classId, facultyId, isActive } = req.query;
    const timetables = await timetableService.getTimetables({
      classId: classId as string,
      facultyId: facultyId as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    });
    res.json(timetables);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { teachingAssignmentId, dayOfWeek, startTime, endTime, roomId, effectiveFrom, effectiveTo } = req.body;
    const timetable = await timetableService.createTimetable({
      teachingAssignmentId,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      roomId,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
    });
    res.status(201).json(timetable);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime, roomId, effectiveFrom, effectiveTo, isActive } = req.body;
    const timetable = await timetableService.updateTimetable(req.params.id, {
      dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : undefined,
      startTime,
      endTime,
      roomId,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      isActive
    });
    res.json(timetable);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    await timetableService.deleteTimetable(req.params.id);
    res.json({ message: 'Timetable deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

// Admin manual generation trigger
router.post('/generate', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { startDate, days } = req.body;
    const result = await scheduleService.generateScheduledClasses(
      startDate ? new Date(startDate) : new Date(),
      days ? Number(days) : 30
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
