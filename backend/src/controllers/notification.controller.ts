import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response';

export const notificationController = {
  
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const schema = z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
        unreadOnly: z.string().optional().transform(val => val === 'true')
      });
      const { page, limit, unreadOnly } = schema.parse(req.query);

      const data = await notificationService.getNotifications(userId, page, limit, unreadOnly);
      return sendSuccess(res, 200, data);
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const count = await notificationService.getUnreadCount(userId);
      return sendSuccess(res, 200, count);
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const notificationId = z.string().uuid().parse(req.params.id);

      await notificationService.markAsRead(userId, notificationId);
      return sendSuccess(res, 200, null, 'Marked as read');
    } catch (error: any) {
      if (error.message.includes('NOT_FOUND')) return sendError(res, 404, error.message);
      next(error);
    }
  },

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      await notificationService.markAllAsRead(userId);
      return sendSuccess(res, 200, null, 'All marked as read');
    } catch (error) {
      next(error);
    }
  },

  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const pref = await notificationService.getPreferences(userId);
      return sendSuccess(res, 200, pref);
    } catch (error) {
      next(error);
    }
  },

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const schema = z.object({
        emailEnabled: z.boolean().optional(),
        attendanceAlertsEnabled: z.boolean().optional(),
        systemAlertsEnabled: z.boolean().optional()
      });
      const data = schema.parse(req.body);

      const pref = await notificationService.updatePreferences(userId, data);
      return sendSuccess(res, 200, pref, 'Preferences updated');
    } catch (error) {
      next(error);
    }
  }
};
