import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { faceService } from '../services/faceRecognition.service';
import { sendSuccess, sendError } from '../utils/response';

// Basic rate limiter
const faceRateLimit = new Map<string, { count: number, resetTime: number }>();

export const faceController = {
  
  async enrollFace(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const schema = z.object({ image: z.string().min(100) });
      const { image } = schema.parse(req.body);

      const result = await faceService.enrollFace(userId, image);
      return sendSuccess(res, 201, result, 'Face enrolled successfully');
    } catch (err: any) {
      if (err.message.includes('ALREADY_ENROLLED')) return sendError(res, 409, err.message);
      if (err.message.includes('NO_FACE') || err.message.includes('MULTIPLE_FACES')) return sendError(res, 400, err.message);
      next(err);
    }
  },

  async verifyAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      // Rate limit: 5 face scans per minute
      const now = Date.now();
      const limitData = faceRateLimit.get(userId);
      if (limitData && limitData.resetTime > now) {
        if (limitData.count >= 5) {
          return sendError(res, 429, 'RATE_LIMITED: Too many face scan attempts. Please wait.');
        }
        limitData.count++;
      } else {
        faceRateLimit.set(userId, { count: 1, resetTime: now + 60000 });
      }

      const schema = z.object({ 
        sessionId: z.string().uuid(),
        image: z.string().min(100) 
      });
      const { sessionId, image } = schema.parse(req.body);

      const record = await faceService.verifyFaceAttendance(userId, sessionId, image);
      return sendSuccess(res, 201, record, 'Attendance marked successfully via Face ID');
    } catch (err: any) {
      if (err.message.includes('NO_ENROLLMENT')) return sendError(res, 403, err.message);
      if (err.message.includes('SESSION_CLOSED')) return sendError(res, 422, err.message);
      if (err.message.includes('WRONG_CLASS')) return sendError(res, 403, err.message);
      if (err.message.includes('NO_FACE') || err.message.includes('MULTIPLE_FACES') || err.message.includes('FACE_MISMATCH')) {
        return sendError(res, 400, err.message);
      }
      if (err.message.includes('ALREADY_MARKED')) return sendError(res, 409, err.message);
      next(err);
    }
  }
};
