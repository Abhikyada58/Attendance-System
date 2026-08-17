/**
 * Security Dashboard Controller — Module 25
 * Admin-only: view security events, active sessions, failed logins.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const SecurityEventQuerySchema = z.object({
  type: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const securityDashboardController = {

  /** GET /admin/security/events — paginated security event log */
  async getSecurityEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, severity, status, page, limit } = SecurityEventQuerySchema.parse(req.query);
      const skip = (page - 1) * limit;

      const where: any = {};
      if (type) where.type = type;
      if (severity) where.severity = severity;
      if (status) where.status = status;

      const [events, total] = await Promise.all([
        prisma.securityEvent.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true, type: true, severity: true, actorId: true, targetId: true,
            ipAddress: true, requestId: true, status: true, createdAt: true, resolvedAt: true,
            metadata: true,
            // adminNotes only for admins — included here since this endpoint is admin-only
            adminNotes: true,
          }
        }),
        prisma.securityEvent.count({ where })
      ]);

      return sendSuccess(res, 200, {
        events,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }, 'Security events retrieved.');
    } catch (error) { next(error); }
  },

  /** PATCH /admin/security/events/:id — update status/notes */
  async updateSecurityEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const validStatuses = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];
      if (status && !validStatuses.includes(status))
        return sendError(res, 400, 'Invalid status.', 'VALIDATION_ERROR');

      const updated = await prisma.securityEvent.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(adminNotes !== undefined && { adminNotes }),
          ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
        },
        select: { id: true, type: true, severity: true, status: true, adminNotes: true, resolvedAt: true }
      });

      return sendSuccess(res, 200, { event: updated }, 'Security event updated.');
    } catch (error) { next(error); }
  },

  /** GET /admin/security/sessions — all active sessions system-wide */
  async getAllActiveSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = await prisma.userSession.findMany({
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
        select: {
          id: true, userId: true, deviceInfo: true, ipAddress: true,
          createdAt: true, lastUsedAt: true, expiresAt: true,
          user: { select: { name: true, email: true, role: true } }
        },
        orderBy: { lastUsedAt: 'desc' },
        take: 100,
      });

      return sendSuccess(res, 200, { sessions, total: sessions.length }, 'Active sessions retrieved.');
    } catch (error) { next(error); }
  },

  /** GET /admin/security/failed-logins — recent failed attempts */
  async getFailedLogins(req: Request, res: Response, next: NextFunction) {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60_000); // Last 24h
      const attempts = await prisma.loginAttempt.findMany({
        where: { success: false, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { id: true, email: true, ipAddress: true, failReason: true, createdAt: true }
      });

      // Group by email for pattern detection
      const byEmail: Record<string, number> = {};
      attempts.forEach(a => { byEmail[a.email] = (byEmail[a.email] || 0) + 1; });
      const suspiciousEmails = Object.entries(byEmail)
        .filter(([, count]) => count >= 3)
        .map(([email, count]) => ({ email, count }));

      return sendSuccess(res, 200, {
        attempts,
        suspiciousEmails,
        total: attempts.length
      }, 'Failed login attempts retrieved.');
    } catch (error) { next(error); }
  },

  /** GET /admin/security/summary — dashboard stats */
  async getSecuritySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60_000);

      const [
        activeSessionCount,
        failedLoginsToday,
        openSecurityEvents,
        criticalEvents,
        highSeverityEvents,
      ] = await Promise.all([
        prisma.userSession.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
        prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: since24h } } }),
        prisma.securityEvent.count({ where: { status: 'OPEN' } }),
        prisma.securityEvent.count({ where: { severity: 'CRITICAL', createdAt: { gte: since24h } } }),
        prisma.securityEvent.count({ where: { severity: 'HIGH', createdAt: { gte: since24h } } }),
      ]);

      return sendSuccess(res, 200, {
        summary: {
          activeSessions: activeSessionCount,
          failedLoginsLast24h: failedLoginsToday,
          openSecurityEvents,
          criticalEventsLast24h: criticalEvents,
          highSeverityEventsLast24h: highSeverityEvents,
        }
      }, 'Security summary retrieved.');
    } catch (error) { next(error); }
  },
};
