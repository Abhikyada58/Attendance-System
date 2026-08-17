/**
 * Centralized Error Handling Middleware — Module 26 Hardened
 *
 * Changes:
 * - Uses structured logger (never exposes stack to users)
 * - Includes requestId in error response for support correlation
 * - Distinguishes 4xx (client error) from 5xx (system error)
 * - 5xx errors increment error metrics
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { increment } from '../services/metrics.service';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || err.status || 500;
  const requestId = req.requestId || 'unknown';
  const isSystemError = statusCode >= 500;

  if (isSystemError) {
    // 5xx = unexpected system failure → structured ERROR log
    logger.error(
      'http',
      'REQUEST_FAILED',
      `${req.method} ${req.path} → ${statusCode}: ${err.message}`,
      err instanceof Error ? err : undefined,
      { requestId, metadata: { route: req.path, method: req.method, statusCode } }
    );
    increment('http.5xx.total');
  } else if (statusCode >= 400) {
    // 4xx = expected client error → only WARN in certain cases
    if (statusCode !== 400 && statusCode !== 404) {
      logger.warn('http', 'CLIENT_ERROR', `${req.method} ${req.path} → ${statusCode}`,
        { requestId, metadata: { statusCode } });
    }
  }

  // Safe message for client — never leak stack trace
  const message = isSystemError && process.env.NODE_ENV === 'production'
    ? 'An internal error occurred.'
    : err.message || 'An unexpected error occurred.';

  // Always include requestId in error response for support correlation
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: err.code || (isSystemError ? 'INTERNAL_ERROR' : 'CLIENT_ERROR'),
      requestId,          // user can report this to support
    }
  });
};
