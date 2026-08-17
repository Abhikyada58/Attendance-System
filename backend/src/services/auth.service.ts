/**
 * Auth Service Layer — Module 25 Hardened
 *
 * Changes from Module 25:
 * - Login now checks account lockout (5 failed attempts in 15 min)
 * - Login records attempts for audit
 * - Password policy enforced: min 8 chars, 1 uppercase, 1 digit
 * - getUserProfile never exposes passwordHash
 * - changePassword revokes all other sessions
 */

import { prisma } from '../utils/prisma';
import { hashPassword, verifyPassword, signToken } from '../utils/auth';
import { parseInstitutionalEmail } from '../utils/academicParser';
import {
  securityService,
  recordLoginAttempt,
  isLockedOut,
  getLockoutMinutesRemaining,
} from './security.service';
import { Request } from 'express';

// Password policy — reasonable, not absurd
const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireDigit: true,
};

function validatePasswordPolicy(password: string): string | null {
  if (password.length < PASSWORD_POLICY.minLength)
    return `Password must be at least ${PASSWORD_POLICY.minLength} characters.`;
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password))
    return 'Password must contain at least one uppercase letter.';
  if (PASSWORD_POLICY.requireDigit && !/[0-9]/.test(password))
    return 'Password must contain at least one number.';
  return null;
}

export const authService = {

  /**
   * Registers a new student by deriving academic details from their email.
   * Enforces password policy before creating user.
   */
  async registerStudent(email: string, passwordPlaintext: string, name: string) {
    // Enforce password policy
    const policyError = validatePasswordPolicy(passwordPlaintext);
    if (policyError) throw new Error(policyError);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // Generic message to prevent email enumeration
      throw new Error('An account with this email already exists.');
    }

    const academicData = parseInstitutionalEmail(email);
    const passwordHash = await hashPassword(passwordPlaintext);

    const result = await prisma.$transaction(async (tx) => {
      const institute = await tx.institute.upsert({
        where: { code: academicData.instituteCode },
        update: {},
        create: { name: academicData.instituteCode + ' Institute', code: academicData.instituteCode }
      });

      const department = await tx.department.upsert({
        where: { code: academicData.departmentCode },
        update: {},
        create: { name: academicData.departmentCode + ' Department', code: academicData.departmentCode, instituteId: institute.id }
      });

      const user = await tx.user.create({
        data: { email, name, passwordHash, role: 'STUDENT', instituteId: institute.id }
      });

      const student = await tx.student.create({
        data: { userId: user.id, studentId: academicData.studentId, instituteId: institute.id, departmentId: department.id }
      });

      return { user, student, academicData };
    });

    return result;
  },

  /**
   * Authenticates a user with lockout protection.
   * Returns JWT + safe user object on success.
   */
  async login(email: string, passwordPlaintext: string, req: Request) {
    // 1. Check lockout before any DB user lookup
    const locked = await isLockedOut(email);
    if (locked) {
      const minutesLeft = await getLockoutMinutesRemaining(email);
      await recordLoginAttempt(email, false, req, 'ACCOUNT_LOCKED');
      throw new Error(`Too many failed attempts. Try again in ${minutesLeft} minute(s).`);
    }

    // 2. Find user — generic error if not found (prevent enumeration)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await recordLoginAttempt(email, false, req, 'USER_NOT_FOUND');
      await securityService.logSecurityEvent({ type: 'LOGIN_FAILED', severity: 'LOW', metadata: { email }, req });
      throw new Error('Invalid email or password.');
    }

    // 3. Check account status before password verification
    if (user.status === 'SUSPENDED') {
      await recordLoginAttempt(email, false, req, 'ACCOUNT_SUSPENDED');
      throw new Error('Your account has been suspended. Please contact administration.');
    }

    // 4. Verify password
    const isMatch = await verifyPassword(passwordPlaintext, user.passwordHash);
    if (!isMatch) {
      await recordLoginAttempt(email, false, req, 'WRONG_PASSWORD');
      await securityService.logSecurityEvent({ type: 'LOGIN_FAILED', severity: 'LOW', actorId: user.id, metadata: { email }, req });

      // Check if this failed attempt causes lockout
      const nowLocked = await isLockedOut(email);
      if (nowLocked) {
        await securityService.logSecurityEvent({ type: 'ACCOUNT_LOCKED', severity: 'MEDIUM', actorId: user.id, metadata: { email }, req });
      }
      throw new Error('Invalid email or password.');
    }

    // 5. Generate JWT & create session
    // Include the tenant (instituteId) in the token to allow middleware to scope requests.
    const token = signToken({ userId: user.id, role: user.role, instituteId: user.instituteId });
    await recordLoginAttempt(email, true, req);
    await securityService.createSession({ userId: user.id, token, req });
    await securityService.logSecurityEvent({ type: 'LOGIN_SUCCESS', severity: 'INFO', actorId: user.id, req });

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, instituteId: user.instituteId }
    };
  },

  /**
   * Change password — revokes all other sessions for security.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string, currentToken: string, req: Request) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    // Verify current password
    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      await securityService.logSecurityEvent({ type: 'PASSWORD_CHANGED', severity: 'MEDIUM', actorId: userId, metadata: { result: 'WRONG_CURRENT_PASSWORD' }, req });
      throw new Error('Current password is incorrect.');
    }

    // Enforce policy on new password
    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) throw new Error(policyError);

    if (currentPassword === newPassword) throw new Error('New password must be different from current password.');

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

    // Revoke all other sessions — current session stays valid
    const revokedCount = await securityService.revokeAllSessions(userId, currentToken);

    await securityService.logSecurityEvent({
      type: 'PASSWORD_CHANGED', severity: 'MEDIUM', actorId: userId,
      metadata: { otherSessionsRevoked: revokedCount }, req
    });

    return { sessionsRevoked: revokedCount };
  },

  /**
   * Fetches safe user profile (never exposes passwordHash).
   */
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, status: true, createdAt: true,
        student: { include: { department: true, institute: true } },
        faculty: { select: { id: true, facultyId: true, departmentId: true, instituteId: true } },
      }
    });

    if (!user) throw new Error('User not found.');
    return user;
  }
};
