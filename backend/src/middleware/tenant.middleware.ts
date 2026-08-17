/**
 * Tenant Middleware - Module 29
 * 
 * Extracts the tenant context (`instituteId`) from the authenticated user's JWT
 * and attaches it to the request object. If a SUPER_ADMIN requests a specific
 * tenant via headers, it allows the override for administrative actions.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

// Extend Express Request interface to include tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any; // Populated by authMiddleware prior to this

  if (!user) {
    return next(new AppError('Unauthorized - Missing user context', 401));
  }

  // 1. Super Admin Override
  if (user.role === 'SUPER_ADMIN') {
    const requestedTenant = req.headers['x-tenant-id'] as string;
    if (requestedTenant) {
      req.tenantId = requestedTenant;
    } else {
      // Super Admin operating globally
      req.tenantId = undefined; 
    }
    return next();
  }

  // 2. Standard User Tenant Resolution
  // Users (STUDENT, FACULTY, ADMIN) belong to an institution.
  const tenantId = user.instituteId;

  if (!tenantId) {
    return next(new AppError('Forbidden - User does not belong to a valid tenant', 403));
  }

  // Set the context
  req.tenantId = tenantId;
  
  next();
};
