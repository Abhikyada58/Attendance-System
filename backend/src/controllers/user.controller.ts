/**
 * User Controller
 * 
 * Validates incoming requests before passing them to the User Service.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';
import { AccountStatus } from '@prisma/client';

const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').optional(),
});

const UpdateStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
});

export const userController = {
  
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await userService.getProfile(userId);
      return sendSuccess(res, 200, profile, 'Profile retrieved successfully.');
    } catch (error) {
      next(error);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const data = UpdateProfileSchema.parse(req.body);

      const updated = await userService.updateProfile(userId, data);
      return sendSuccess(res, 200, updated, 'Profile updated successfully.');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, (error as any).errors[0].message, 'VALIDATION_ERROR');
      }
      next(error);
    }
  },

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.listUsers();
      return sendSuccess(res, 200, users, 'Users retrieved successfully.');
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.id;
      const adminId = req.user!.userId;
      
      const { status } = UpdateStatusSchema.parse(req.body);

      const updated = await userService.updateUserStatus(targetUserId, status, adminId);
      return sendSuccess(res, 200, updated, `User status updated to ${status}.`);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, (error as any).errors[0].message, 'VALIDATION_ERROR');
      }
      if (error.message.includes('suspend your own')) {
        return sendError(res, 403, error.message, 'ACTION_FORBIDDEN');
      }
      next(error);
    }
  },

  // Role-based testing endpoints
  async adminTest(req: Request, res: Response) {
    return sendSuccess(res, 200, { role: req.user!.role }, 'You accessed an ADMIN only route.');
  },
  
  async facultyTest(req: Request, res: Response) {
    return sendSuccess(res, 200, { role: req.user!.role }, 'You accessed a FACULTY only route.');
  },
  
  async studentTest(req: Request, res: Response) {
    return sendSuccess(res, 200, { role: req.user!.role }, 'You accessed a STUDENT only route.');
  }
};
