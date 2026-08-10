import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminService } from '../services/admin.service';
import { auditService } from '../services/audit.service';
import { configurationService } from '../services/configuration.service';
import { sendSuccess, sendError } from '../utils/response';
import { AccountStatus } from '@prisma/client';

export const adminController = {
  
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      return sendSuccess(res, 200, stats);
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
        search: z.string().optional(),
        role: z.string().optional(),
        status: z.string().optional()
      });
      const { page, limit, search, role, status } = schema.parse(req.query);

      const data = await adminService.getUsers(page, limit, search, role, status);
      return sendSuccess(res, 200, data);
    } catch (error) {
      next(error);
    }
  },

  async setUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).user.userId;
      const targetUserId = z.string().uuid().parse(req.params.id);
      
      const schema = z.object({
        status: z.enum([AccountStatus.ACTIVE, AccountStatus.INACTIVE, AccountStatus.SUSPENDED, AccountStatus.PENDING])
      });
      const { status } = schema.parse(req.body);

      const result = await adminService.setUserStatus(adminUserId, targetUserId, status);
      return sendSuccess(res, 200, result, `User status updated to ${status}`);
    } catch (error: any) {
      if (error.message === 'User not found') return sendError(res, 404, error.message);
      next(error);
    }
  },

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        page: z.string().optional().transform(val => val ? parseInt(val) : 1),
        limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
        action: z.string().optional(),
        entityType: z.string().optional()
      });
      const { page, limit, action, entityType } = schema.parse(req.query);

      const data = await auditService.getAuditLogs(page, limit, { action, entityType });
      return sendSuccess(res, 200, data);
    } catch (error) {
      next(error);
    }
  },

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await configurationService.getAllConfiguration();
      return sendSuccess(res, 200, settings);
    } catch (error) {
      next(error);
    }
  },

  async updateSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).user.userId;
      const key = z.string().parse(req.params.key);
      const schema = z.object({
        value: z.string(),
        category: z.any().optional(), // SettingCategory
        type: z.any().optional(), // SettingType
        description: z.string().optional()
      });
      const { value, category, type, description } = schema.parse(req.body);

      const setting = await configurationService.updateSetting(adminUserId, key, value, category || 'SYSTEM', type || 'STRING', description);
      return sendSuccess(res, 200, setting, 'Setting updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateFeatureFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).user.userId;
      const key = z.string().parse(req.params.key);
      const schema = z.object({
        enabled: z.boolean(),
        description: z.string().optional()
      });
      const { enabled, description } = schema.parse(req.body);

      const flag = await configurationService.updateFeatureFlag(adminUserId, key, enabled, description);
      return sendSuccess(res, 200, flag, 'Feature flag updated successfully');
    } catch (error) {
      next(error);
    }
  }
};
