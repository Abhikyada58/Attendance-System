/**
 * Idempotency Middleware - Module 30
 * 
 * Safely handles duplicate POST/PATCH/DELETE requests by caching successful responses
 * against a unique 'Idempotency-Key' provided by the client.
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from './error.middleware';
import crypto from 'crypto';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // We only enforce idempotency on state-changing requests
  if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (!idempotencyKey) {
    // If not provided, we allow it (unless strictly enforced globally, but that breaks standard clients)
    return next();
  }

  try {
    const tenantId = (req as any).tenantId || null;
    const userId = req.user ? (req.user as any).id : null;

    // Use a transaction to ensure atomic check-and-set
    const result = await prisma.$transaction(async (tx) => {
      let record = await tx.idempotencyKey.findUnique({
        where: { id: idempotencyKey }
      });

      if (record) {
        // Validation: Ensure the key isn't being reused across different endpoints or tenants
        if (record.endpoint !== req.originalUrl || record.instituteId !== tenantId) {
          throw new AppError('Idempotency-Key is already in use for a different request scope.', 409);
        }

        return { record, isNew: false };
      }

      // Create lock
      record = await tx.idempotencyKey.create({
        data: {
          id: idempotencyKey,
          instituteId: tenantId,
          userId,
          endpoint: req.originalUrl,
          status: 'PROCESSING',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hour expiry
        }
      });

      return { record, isNew: true };
    });

    if (!result.isNew) {
      if (result.record.status === 'COMPLETED') {
        // Return cached successful response immediately
        return res.status(result.record.statusCode || 200).json(result.record.response);
      }
      
      if (result.record.status === 'PROCESSING') {
        throw new AppError('A request with this Idempotency-Key is currently being processed.', 409);
      }
    }

    // Intercept response to save success data
    const originalJson = res.json;
    res.json = function (body: any) {
      // Only cache successful status codes (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Fire and forget caching update
        prisma.idempotencyKey.update({
          where: { id: idempotencyKey },
          data: {
            status: 'COMPLETED',
            statusCode: res.statusCode,
            response: body
          }
        }).catch(err => console.error('Failed to save idempotency response', err));
      } else {
        // If it failed, delete the key so it can be retried
        prisma.idempotencyKey.delete({
          where: { id: idempotencyKey }
        }).catch(() => {}); // Ignore errors
      }

      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    next(error);
  }
};
