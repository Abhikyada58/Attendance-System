/**
 * Authentication Middleware
 * 
 * WHY THIS EXISTS:
 * Protects routes from unauthenticated access. It intercepts the HTTP request,
 * looks for an "Authorization: Bearer <token>" header, and verifies the JWT.
 * If valid, it attaches the user data to req.user for the controller to use.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/auth';
import { sendError } from '../utils/response';
import { prisma } from '../utils/prisma';

// Extend Express Request interface to include the user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'Authentication required. Missing Bearer token.', 'AUTH_MISSING_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    try {
      // If token is valid, verifyToken returns the payload.
      const payload = verifyToken(token);
      
      // IMPORTANT SECURITY CHECK:
      // Even if the JWT is valid, we must verify the user's account hasn't been suspended recently.
      // This requires a fast DB lookup.
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { status: true }
      });

      if (!user) {
        return sendError(res, 401, 'User account no longer exists.', 'AUTH_ACCOUNT_MISSING');
      }

      if (user.status === 'SUSPENDED') {
        return sendError(res, 403, 'Your account has been suspended. Please contact administration.', 'AUTH_ACCOUNT_SUSPENDED');
      }
      
      // Attach to the request object so subsequent controllers know WHO made the request
      req.user = payload;
      next();
    } catch (err: any) {
      // jwt.verify throws specific errors for expiration or invalid signatures
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 401, 'Authentication token expired. Please log in again.', 'AUTH_TOKEN_EXPIRED');
      }
      return sendError(res, 401, 'Invalid authentication token.', 'AUTH_INVALID_TOKEN');
    }
  } catch (error) {
    next(error);
  }
};
