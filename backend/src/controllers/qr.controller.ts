import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { qrService } from '../services/qr.service';
import { sendSuccess, sendError } from '../utils/response';

// Basic in-memory rate limiter for scan endpoint
const scanRateLimit = new Map<string, { count: number, resetTime: number }>();

export const qrController = {

  // FACULTY: Generate Token
  async generateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const sessionId = z.string().uuid().parse(req.params.sessionId);

      const tokenData = await qrService.generateToken(userId, sessionId);
      return sendSuccess(res, 201, tokenData);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) return sendError(res, 403, err.message);
      if (err.message.includes('closed')) return sendError(res, 422, err.message);
      next(err);
    }
  },

  // FACULTY: Revoke Token
  async revokeToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const sessionId = z.string().uuid().parse(req.params.sessionId);

      const result = await qrService.revokeToken(userId, sessionId);
      return sendSuccess(res, 200, result);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) return sendError(res, 403, err.message);
      next(err);
    }
  },

  // FACULTY: Get Status
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const sessionId = z.string().uuid().parse(req.params.sessionId);

      const result = await qrService.getTokenStatus(userId, sessionId);
      return sendSuccess(res, 200, result);
    } catch (err: any) {
      if (err.message.includes('Forbidden')) return sendError(res, 403, err.message);
      next(err);
    }
  },

  // STUDENT: Scan Token
  async scanToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      // Rate limiting: max 5 scans per minute per user
      const now = Date.now();
      const limitData = scanRateLimit.get(userId);
      if (limitData && limitData.resetTime > now) {
        if (limitData.count >= 5) {
          return sendError(res, 429, 'RATE_LIMITED: Too many scan attempts. Please wait a minute.');
        }
        limitData.count++;
      } else {
        scanRateLimit.set(userId, { count: 1, resetTime: now + 60000 });
      }

      const schema = z.object({ token: z.string().min(10) });
      const { token } = schema.parse(req.body);

      const record = await qrService.scanToken(userId, token);
      return sendSuccess(res, 201, record, 'Attendance marked successfully');
    } catch (err: any) {
      if (err.message.includes('UNAUTHORIZED')) return sendError(res, 403, err.message);
      if (err.message.includes('INVALID_QR')) return sendError(res, 400, err.message);
      if (err.message.includes('QR_EXPIRED')) return sendError(res, 422, err.message);
      if (err.message.includes('QR_REVOKED')) return sendError(res, 422, err.message);
      if (err.message.includes('SESSION_CLOSED')) return sendError(res, 422, err.message);
      if (err.message.includes('WRONG_CLASS')) return sendError(res, 403, err.message);
      if (err.message.includes('ALREADY_MARKED')) return sendError(res, 409, err.message);
      next(err);
    }
  }
};
