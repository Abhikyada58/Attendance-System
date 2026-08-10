/**
 * Role-Based Authorization Middleware
 * 
 * WHY THIS EXISTS:
 * After `requireAuth` successfully identifies WHO the user is, this middleware 
 * checks WHAT they are allowed to do. It takes a list of permitted roles and 
 * compares it against the user's role from the JWT payload.
 * If the user's role isn't in the list, it returns a 403 Forbidden.
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.user is populated by requireAuth. If it's missing, authentication failed.
      if (!req.user) {
        return sendError(res, 401, 'Authentication required before checking permissions.', 'AUTH_REQUIRED');
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return sendError(
          res, 
          403, 
          `Access Denied. This action requires one of the following roles: ${allowedRoles.join(', ')}.`, 
          'FORBIDDEN_ROLE'
        );
      }

      // User has permission, proceed to the controller
      next();
    } catch (error) {
      next(error);
    }
  };
};
