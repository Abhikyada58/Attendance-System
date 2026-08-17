/**
 * Request Logger Middleware — Module 26
 *
 * Replaces morgan with structured, redaction-aware request logging.
 * - Logs: method, route, status, duration, requestId (no body contents)
 * - Records HTTP metrics via MetricsRegistry
 * - Does NOT log: request/response bodies, auth headers, cookies
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { metrics } from '../services/metrics.service';

/** Safe route normalizer — removes dynamic IDs from route for grouping */
function normalizeRoute(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUID
    .replace(/\/\d+/g, '/:id') // numeric IDs
    .split('?')[0]; // strip query string
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = normalizeRoute(req.path);
    const status = res.statusCode;
    const method = req.method;

    // Record HTTP metrics
    metrics.httpRequest(method, route, status, duration);

    // Log level based on status
    const isError = status >= 500;
    const isWarn = status >= 400 && status < 500;

    // Skip logging 2xx health checks to reduce noise
    const isHealthCheck = req.path.includes('/health');
    if (!isError && !isWarn && isHealthCheck) return;

    const meta = {
      requestId: req.requestId,
      userId: req.user?.userId,
      duration,
      metadata: { method, route, status, ip: req.ip?.split(',')[0] }
    };

    if (isError) {
      logger.warn('http', 'REQUEST_FAILED', `${method} ${route} → ${status}`, meta);
    } else if (isWarn) {
      logger.warn('http', 'REQUEST_COMPLETED', `${method} ${route} → ${status}`, meta);
    } else {
      logger.info('http', 'REQUEST_COMPLETED', `${method} ${route} → ${status}`, meta);
    }
  });

  next();
};
