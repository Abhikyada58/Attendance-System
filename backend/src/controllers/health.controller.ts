/**
 * Health Controller — Module 26
 *
 * Three endpoints:
 *   GET /health        — full readiness check (DB, AI, services)
 *   GET /health/live   — liveness: is process alive?
 *   GET /health/ready  — readiness: can we serve traffic?
 *
 * Service status levels:
 *   healthy    — fully operational
 *   degraded   — working but slower / partial
 *   unavailable — not responding
 *   unknown    — not checked yet
 */

import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { APP_START_TIME } from '../app';
import { metrics } from '../services/metrics.service';

type ServiceStatus = 'healthy' | 'degraded' | 'unavailable' | 'unknown';

interface ServiceCheck {
  name: string;
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return {
      name: 'Database (PostgreSQL)',
      status: latencyMs > 500 ? 'degraded' : 'healthy',
      latencyMs,
      checkedAt: new Date().toISOString()
    };
  } catch (err: any) {
    return { name: 'Database (PostgreSQL)', status: 'unavailable', message: 'Connection failed', checkedAt: new Date().toISOString() };
  }
}

async function checkAIService(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    // Check if AI service endpoint is configured and reachable
    const aiUrl = process.env.AI_SERVICE_URL;
    if (!aiUrl) return { name: 'AI Service', status: 'unknown', message: 'AI_SERVICE_URL not configured', checkedAt: new Date().toISOString() };

    const res = await fetch(`${aiUrl}/health`, { signal: AbortSignal.timeout(3000) });
    const latencyMs = Date.now() - start;
    return {
      name: 'AI Service',
      status: res.ok ? 'healthy' : 'degraded',
      latencyMs,
      checkedAt: new Date().toISOString()
    };
  } catch {
    return { name: 'AI Service', status: 'unavailable', message: 'AI service unreachable', checkedAt: new Date().toISOString() };
  }
}

async function checkNotificationService(): Promise<ServiceCheck> {
  // Check if notification preference table is accessible (proxy for notification infra)
  const start = Date.now();
  try {
    await prisma.notification.count({ where: { createdAt: { gte: new Date(Date.now() - 60_000) } } });
    return { name: 'Notification Service', status: 'healthy', latencyMs: Date.now() - start, checkedAt: new Date().toISOString() };
  } catch {
    return { name: 'Notification Service', status: 'degraded', message: 'Cannot query notifications', checkedAt: new Date().toISOString() };
  }
}

/** GET /health/live — lightweight liveness: is process running? */
export const livenessCheck = (_req: Request, res: Response) => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
};

/** GET /health/ready — is the instance ready to serve traffic? (checks DB only) */
export const readinessCheck = async (_req: Request, res: Response) => {
  const db = await checkDatabase();
  const ready = db.status !== 'unavailable';
  res.status(ready ? 200 : 503).json({
    ready,
    database: db.status,
    timestamp: new Date().toISOString()
  });
};

/** GET /health — full system health check */
export const fullHealthCheck = async (_req: Request, res: Response) => {
  const [db, ai, notif] = await Promise.all([
    checkDatabase(),
    checkAIService(),
    checkNotificationService(),
  ]);

  const services: ServiceCheck[] = [db, ai, notif];
  const hasUnavailable = services.some(s => s.status === 'unavailable');
  const hasDegraded = services.some(s => s.status === 'degraded');

  const overallStatus: ServiceStatus = hasUnavailable ? 'unavailable' : hasDegraded ? 'degraded' : 'healthy';
  const httpStatus = overallStatus === 'unavailable' ? 503 : overallStatus === 'degraded' ? 207 : 200;

  const uptimeSeconds = Math.floor((Date.now() - APP_START_TIME) / 1000);

  res.status(httpStatus).json({
    status: overallStatus,
    uptime: uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    timestamp: new Date().toISOString(),
    services,
    metrics: {
      totalRequests: metrics.getCounter('http.requests.total'),
      errors5xx: metrics.getCounter('http.5xx.total'),
      jobsFailed: metrics.getCounter('job.failed.total'),
      httpLatency: metrics.getHistogramStats('http.latency'),
    }
  });
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [d > 0 && `${d}d`, h > 0 && `${h}h`, m > 0 && `${m}m`, `${s}s`].filter(Boolean).join(' ');
}
