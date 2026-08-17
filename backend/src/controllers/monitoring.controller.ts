/**
 * Monitoring Controller — Module 26
 * Admin-only: metrics, logs, incidents, system overview.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { metrics } from '../services/metrics.service';
import { logger } from '../utils/logger';
import { incidentService } from '../services/incident.service';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { APP_START_TIME } from '../app';

const CreateIncidentSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000).optional(),
  severity: z.enum(['SEV1', 'SEV2', 'SEV3', 'SEV4']),
  affectedService: z.string().max(100).optional(),
});

const UpdateIncidentSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().max(2000).optional(),
  severity: z.enum(['SEV1', 'SEV2', 'SEV3', 'SEV4']).optional(),
  affectedService: z.string().max(100).optional(),
  assignedToId: z.string().uuid().optional(),
  rootCause: z.string().max(2000).optional(),
  impactSummary: z.string().max(2000).optional(),
  preventionNotes: z.string().max(2000).optional(),
});

export const monitoringController = {

  // ─── System Overview ─────────────────────────────────────────────────────────

  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const uptimeSeconds = Math.floor((Date.now() - APP_START_TIME) / 1000);
      const snapshot = metrics.snapshotAll();
      const incidentSummary = await incidentService.getSummary();
      const logSummary = await prisma.appLog.groupBy({
        by: ['level'],
        _count: true,
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) } }
      });

      return sendSuccess(res, 200, {
        uptime: uptimeSeconds,
        uptimeFormatted: formatUptime(uptimeSeconds),
        metrics: snapshot,
        incidents: incidentSummary,
        logs: { last24h: logSummary },
        timestamp: new Date().toISOString(),
      }, 'Monitoring overview retrieved.');
    } catch (err) { next(err); }
  },

  // ─── Metrics ─────────────────────────────────────────────────────────────────

  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, 200, { metrics: metrics.snapshotAll() }, 'Metrics retrieved.');
    } catch (err) { next(err); }
  },

  async getMetricHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { metric, hours = '24' } = req.query as { metric?: string; hours?: string };
      const since = new Date(Date.now() - parseInt(hours) * 60 * 60_000);

      const rows = await prisma.appMetricSnapshot.findMany({
        where: { ...(metric ? { metric } : {}), capturedAt: { gte: since } },
        orderBy: { capturedAt: 'asc' },
        take: 500,
        select: { metric: true, value: true, capturedAt: true }
      });

      return sendSuccess(res, 200, { history: rows }, 'Metric history retrieved.');
    } catch (err) { next(err); }
  },

  // ─── Log Search ──────────────────────────────────────────────────────────────

  async searchLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { level, service, event, requestId, hours = '24' } = req.query as Record<string, string>;
      const since = new Date(Date.now() - parseInt(hours || '24') * 60 * 60_000);

      const logs = await logger.search({ level, service, event, requestId, since, limit: 100 });
      return sendSuccess(res, 200, { logs, total: logs.length }, 'Logs retrieved.');
    } catch (err) { next(err); }
  },

  // ─── Incidents ────────────────────────────────────────────────────────────────

  async createIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateIncidentSchema.parse(req.body);
      const incident = await incidentService.create({
        ...data,
        severity: data.severity as IncidentSeverity,
        createdById: req.user!.userId,
      });
      return sendSuccess(res, 201, { incident }, 'Incident created.');
    } catch (err: any) {
      if (err instanceof z.ZodError) return sendError(res, 400, err.errors[0].message, 'VALIDATION_ERROR');
      next(err);
    }
  },

  async listIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, severity, page = '1', limit = '20' } = req.query as Record<string, string>;
      const result = await incidentService.getAll({
        status: status as IncidentStatus,
        severity: severity as IncidentSeverity,
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 50)
      });
      return sendSuccess(res, 200, result, 'Incidents retrieved.');
    } catch (err) { next(err); }
  },

  async getIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const incident = await incidentService.getById(req.params.id);
      if (!incident) return sendError(res, 404, 'Incident not found.', 'NOT_FOUND');
      return sendSuccess(res, 200, { incident }, 'Incident retrieved.');
    } catch (err) { next(err); }
  },

  async updateIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const data = UpdateIncidentSchema.parse(req.body);
      const incident = await incidentService.update(req.params.id, {
        ...data,
        severity: data.severity as IncidentSeverity | undefined,
      });
      return sendSuccess(res, 200, { incident }, 'Incident updated.');
    } catch (err: any) {
      if (err instanceof z.ZodError) return sendError(res, 400, err.errors[0].message, 'VALIDATION_ERROR');
      next(err);
    }
  },

  async updateIncidentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const validStatuses: IncidentStatus[] = ['DETECTED', 'INVESTIGATING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) return sendError(res, 400, 'Invalid status.', 'VALIDATION_ERROR');

      const incident = await incidentService.updateStatus(req.params.id, status, req.user!.userId);
      return sendSuccess(res, 200, { incident }, 'Incident status updated.');
    } catch (err) { next(err); }
  },

  async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = req.body;
      if (!content || content.trim().length < 3) return sendError(res, 400, 'Note content is required.', 'VALIDATION_ERROR');

      const note = await incidentService.addNote(req.params.id, req.user!.userId, content.trim());
      return sendSuccess(res, 201, { note }, 'Note added.');
    } catch (err) { next(err); }
  },
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d > 0 && `${d}d`, h > 0 && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}
