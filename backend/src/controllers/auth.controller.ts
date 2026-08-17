/**
 * Auth Controller — Module 25 Hardened
 *
 * Added: session management endpoints, password change, logout with revocation
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { securityService } from '../services/security.service';
import { sendSuccess, sendError } from '../utils/response';

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format.').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters.').max(100).trim(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword']
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email format.').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required.'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
  confirmNewPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  message: "New passwords don't match", path: ['confirmNewPassword']
});

export const authController = {

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = RegisterSchema.parse(req.body);
      const result = await authService.registerStudent(data.email, data.password, data.name);
      return sendSuccess(res, 201, {
        user: { id: result.user.id, email: result.user.email, role: result.user.role },
        derivedAcademicInfo: result.academicData
      }, 'Registration successful.');
    } catch (error: any) {
      if (error instanceof z.ZodError) return sendError(res, 400, error.errors[0].message, 'VALIDATION_ERROR');
      if (error.message?.includes('exists') || error.message?.includes('Unsupported') ||
          error.message?.includes('format') || error.message?.includes('Password'))
        return sendError(res, 400, error.message, 'REGISTRATION_ERROR');
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await authService.login(data.email, data.password, req);
      return sendSuccess(res, 200, result, 'Login successful.');
    } catch (error: any) {
      if (error instanceof z.ZodError) return sendError(res, 400, error.errors[0].message, 'VALIDATION_ERROR');
      if (error.message?.includes('Invalid email') || error.message?.includes('suspended') ||
          error.message?.includes('Try again'))
        return sendError(res, 401, error.message, 'AUTH_FAILED');
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await securityService.revokeSession(token);
        await securityService.logSecurityEvent({ type: 'LOGOUT', severity: 'INFO', actorId: req.user?.userId, req });
      }
      return sendSuccess(res, 200, null, 'Logged out successfully.');
    } catch (error) { next(error); }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userProfile = await authService.getUserProfile(req.user!.userId);
      return sendSuccess(res, 200, { user: userProfile }, 'Profile retrieved.');
    } catch (error) { next(error); }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ChangePasswordSchema.parse(req.body);
      const token = req.headers.authorization?.split(' ')[1] || '';
      const result = await authService.changePassword(
        req.user!.userId, data.currentPassword, data.newPassword, token, req
      );
      return sendSuccess(res, 200, result, 'Password changed successfully. Other sessions have been signed out.');
    } catch (error: any) {
      if (error instanceof z.ZodError) return sendError(res, 400, error.errors[0].message, 'VALIDATION_ERROR');
      if (error.message?.includes('incorrect') || error.message?.includes('Password') ||
          error.message?.includes('different'))
        return sendError(res, 400, error.message, 'PASSWORD_ERROR');
      next(error);
    }
  },

  // ─── Session Management ─────────────────────────────────────────────────────

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = await securityService.getActiveSessions(req.user!.userId);
      const currentTokenHash = securityService.hashToken(req.headers.authorization?.split(' ')[1] || '');
      // Mark which session is current (by tokenHash match) — without exposing the hash
      const enriched = sessions.map(s => ({
        ...s,
        isCurrent: false // We don't expose tokenHash to client
      }));
      return sendSuccess(res, 200, { sessions: enriched }, 'Sessions retrieved.');
    } catch (error) { next(error); }
  },

  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      // Verify session belongs to this user before revoking
      const session = await (await import('../utils/prisma')).prisma.userSession.findFirst({
        where: { id: sessionId, userId: req.user!.userId }
      });
      if (!session) return sendError(res, 404, 'Session not found.', 'SESSION_NOT_FOUND');
      if (session.revokedAt) return sendError(res, 400, 'Session already revoked.', 'SESSION_ALREADY_REVOKED');

      await (await import('../utils/prisma')).prisma.userSession.update({
        where: { id: sessionId }, data: { revokedAt: new Date() }
      });
      await securityService.logSecurityEvent({ type: 'SESSION_REVOKED', severity: 'LOW', actorId: req.user!.userId, targetId: sessionId, req });
      return sendSuccess(res, 200, null, 'Session revoked.');
    } catch (error) { next(error); }
  },

  async revokeAllOtherSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const currentToken = req.headers.authorization?.split(' ')[1] || '';
      const count = await securityService.revokeAllSessions(req.user!.userId, currentToken);
      await securityService.logSecurityEvent({ type: 'ALL_SESSIONS_REVOKED', severity: 'MEDIUM', actorId: req.user!.userId, metadata: { revokedCount: count }, req });
      return sendSuccess(res, 200, { revokedCount: count }, `${count} other session(s) signed out.`);
    } catch (error) { next(error); }
  },
};
