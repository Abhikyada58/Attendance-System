import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { supportService } from '../../services/support.service';

const router = Router();
router.use(requireAuth);

// ==========================================
// HELP CENTER (KNOWLEDGE BASE)
// ==========================================

router.get('/articles', async (req, res, next) => {
  try {
    const articles = await supportService.getPublishedArticles();
    res.json(articles);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// STUDENT TICKET ENDPOINTS
// ==========================================

router.post('/tickets', requireRole('STUDENT'), async (req, res, next) => {
  try {
    const ticket = await supportService.createTicket(req.body, (req.user as any)!.id);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

router.get('/tickets/me', requireRole('STUDENT'), async (req, res, next) => {
  try {
    const tickets = await supportService.getMyTickets((req.user as any)!.id);
    res.json(tickets);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// SHARED ENDPOINTS
// ==========================================

router.get('/tickets/:id', async (req, res, next) => {
  try {
    const ticket = await supportService.getTicketDetails(req.params.id, (req.user as any)!.id, (req.user as any)!.role);
    res.json(ticket);
  } catch (error: any) {
    res.status(error.message === 'Unauthorized' ? 403 : 404).json({ error: error.message });
  }
});

router.post('/tickets/:id/comments', async (req, res, next) => {
  try {
    const { message, isInternal } = req.body;
    const comment = await supportService.addComment(req.params.id, (req.user as any)!.id, message, isInternal || false, (req.user as any)!.role);
    res.json(comment);
  } catch (error: any) {
    res.status(error.message === 'Unauthorized' ? 403 : 400).json({ error: error.message });
  }
});

// ==========================================
// ADMIN / SUPPORT ENDPOINTS
// ==========================================

router.get('/tickets', requireRole('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    // Basic filter support, e.g. ?status=OPEN
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    
    const tickets = await supportService.getAllTickets(filters);
    res.json(tickets);
  } catch (error) {
    next(error);
  }
});

router.patch('/tickets/:id/status', requireRole('ADMIN', 'FACULTY'), async (req, res, next) => {
  try {
    const ticket = await supportService.updateTicketStatus(req.params.id, req.body.status, (req.user as any)!.id);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

router.patch('/tickets/:id/assign', requireRole('ADMIN'), async (req, res, next) => {
  try {
    const ticket = await supportService.assignTicket(req.params.id, req.body.assignedToId);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

export default router;
