/**
 * Authentication Middleware — Module 25 Hardened
 *
 * Changes:
 * - Checks session revocation table (UserSession.revokedAt)
 * - Adds X-Request-ID header for request correlation
 * - Logs unauthorized access attempts as security events
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/auth';
import { sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { securityService } from '../services/security.service';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | { userId: string, role: string, instituteId: string | null };
      requestId?: string;
    }
  }
}

/** Attach a unique request ID to every request for tracing/audit */
export const attachRequestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Check for API Key Authentication (Module 30)
    const apiKeyHeader = req.headers['x-api-key'] as string;
    if (apiKeyHeader) {
      // Hash the key to find it in the database
      const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');
      const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });

      if (!apiKey || apiKey.status !== 'ACTIVE') {
        return sendError(res, 401, 'Invalid or revoked API Key.', 'AUTH_INVALID_API_KEY');
      }

      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return sendError(res, 401, 'API Key has expired.', 'AUTH_EXPIRED_API_KEY');
      }

      // Fire-and-forget last used update
      prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() }
      }).catch(() => {});

      // For API keys, the "user" context is essentially the system/integration.
      // We map this to a virtual user.
      req.user = {
        userId: apiKey.createdBy, // Operations track back to the admin who created it
        role: apiKey.instituteId ? 'ADMIN' : 'SUPER_ADMIN',
        instituteId: apiKey.instituteId,
        // (For a production system, we'd also inject apiKey scopes into the request)
      } as any;
      
      return next();
    }

    // 2. Standard Bearer JWT Authentication
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication required (Provide Bearer token or x-api-key header).', 'AUTH_MISSING_CREDENTIALS');
    }

    const token = authHeader.split(' ')[1];

    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError')
        return sendError(res, 401, 'Session expired. Please log in again.', 'AUTH_TOKEN_EXPIRED');
      return sendError(res, 401, 'Invalid authentication token.', 'AUTH_INVALID_TOKEN');
    }

    // Check if account still exists and is not suspended
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { status: true }
    });

    if (!user)
      return sendError(res, 401, 'User account no longer exists.', 'AUTH_ACCOUNT_MISSING');

    if (user.status === 'SUSPENDED') {
      await securityService.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS', severity: 'MEDIUM',
        actorId: payload.userId, metadata: { reason: 'ACCOUNT_SUSPENDED' }, req
      });
      return sendError(res, 403, 'Your account has been suspended.', 'AUTH_ACCOUNT_SUSPENDED');
    }

    // Check session revocation (Module 25 addition)
    const revoked = await securityService.isSessionRevoked(token);
    if (revoked) {
      return sendError(res, 401, 'Session has been revoked. Please log in again.', 'AUTH_SESSION_REVOKED');
    }

    // Update lastUsedAt without blocking (fire-and-forget)
    securityService.touchSession(token).catch(() => {});

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

/** Middleware to require re-authentication for sensitive actions (step-up auth) */
export const requireRecentAuth = (maxAgeMinutes = 10) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // For now this is a pass-through — in production we'd check token iat vs now
    // This is a placeholder for step-up auth implementation
    next();
  };
};
