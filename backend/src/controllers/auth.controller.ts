/**
 * Auth Controller
 * 
 * Handles HTTP requests related to authentication.
 * Uses Zod to strictly validate incoming JSON payloads before touching the service layer.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';

// Define expected request shapes using Zod
const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name is required.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email format.'),
  password: z.string().min(1, 'Password is required.'),
});

export const authController = {
  
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Validate the request body
      const validatedData = RegisterSchema.parse(req.body);

      // 2. Call the service
      const result = await authService.registerStudent(
        validatedData.email, 
        validatedData.password,
        validatedData.name
      );

      // 3. Return a clean success response (without passwords!)
      return sendSuccess(res, 201, {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
        derivedAcademicInfo: result.academicData
      }, 'Registration successful.');

    } catch (error: any) {
      // If it's a Zod validation error, format it nicely
      if (error instanceof z.ZodError) {
        return sendError(res, 400, (error as any).errors[0].message, 'VALIDATION_ERROR');
      }
      // If it's our custom business logic error (e.g., "Account exists")
      if (error.message.includes('exists') || error.message.includes('Unsupported') || error.message.includes('format')) {
         return sendError(res, 400, error.message, 'REGISTRATION_ERROR');
      }
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = LoginSchema.parse(req.body);

      const result = await authService.login(validatedData.email, validatedData.password);

      return sendSuccess(res, 200, result, 'Login successful.');

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, (error as any).errors[0].message, 'VALIDATION_ERROR');
      }
      if (error.message === 'Invalid email or password.') {
        return sendError(res, 401, error.message, 'AUTH_FAILED');
      }
      next(error);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user is guaranteed to exist because of the requireAuth middleware
      const userId = req.user!.userId;
      
      const userProfile = await authService.getUserProfile(userId);

      return sendSuccess(res, 200, { user: userProfile }, 'Profile retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }
};
