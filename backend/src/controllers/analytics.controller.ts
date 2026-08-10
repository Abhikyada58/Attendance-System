import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/response';

export const analyticsController = {
  // STUDENT
  async getStudentOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const data = await analyticsService.getStudentOverview(userId);
      return sendSuccess(res, 200, data);
    } catch (err) {
      next(err);
    }
  },

  async getStudentSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const data = await analyticsService.getStudentSubjects(userId);
      return sendSuccess(res, 200, data);
    } catch (err) {
      next(err);
    }
  },

  async getStudentMonthly(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const data = await analyticsService.getStudentMonthly(userId);
      return sendSuccess(res, 200, data);
    } catch (err) {
      next(err);
    }
  },

  // FACULTY
  async getFacultyOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const data = await analyticsService.getFacultyOverview(userId);
      return sendSuccess(res, 200, data);
    } catch (err) {
      next(err);
    }
  },

  async getFacultyClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const data = await analyticsService.getFacultyClasses(userId);
      return sendSuccess(res, 200, data);
    } catch (err) {
      next(err);
    }
  }
};
