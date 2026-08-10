import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { announcementService } from '../../services/announcement.service';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const announcements = await announcementService.getAnnouncements({
      ...(req.query.status ? { status: req.query.status } : {})
    });
    res.json(announcements);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const announcement = await announcementService.createAnnouncement({
      ...req.body,
      createdBy: (req.user as any)!.id
    });
    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireRole('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);
    res.json(announcement);
  } catch (error) {
    next(error);
  }
});

// Manual publish trigger
router.post('/:id/publish', requireRole('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const announcement = await announcementService.publishAnnouncement(req.params.id);
    res.json(announcement);
  } catch (error) {
    next(error);
  }
});

export default router;
