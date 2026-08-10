import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { calendarService } from '../../services/calendar.service';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const { academicYearId, startDate, endDate } = req.query;
    if (!academicYearId) {
      return res.status(400).json({ error: 'academicYearId is required' });
    }
    const events = await calendarService.getEvents(
      academicYearId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json(events);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { academicYearId, date, type, title, description, isWorkingDay } = req.body;
    const event = await calendarService.createEvent({
      academicYearId,
      date: new Date(date),
      type,
      title,
      description,
      isWorkingDay: Boolean(isWorkingDay)
    });
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const event = await calendarService.updateEvent(req.params.id, req.body);
    res.json(event);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireRole('ADMIN'), async (req, res, next) => {
  try {
    await calendarService.deleteEvent(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
