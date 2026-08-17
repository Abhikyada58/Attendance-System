/**
 * Security Service — Module 25
 *
 * Centralizes security event logging, session management helpers,
 * and failed-login tracking. No secret values are ever stored in events.
 */

import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import { Request } from 'express';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SecurityEventType =
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT'
  | 'SESSION_REVOKED' | 'ALL_SESSIONS_REVOKED'
  | 'PASSWORD_CHANGED' | 'PASSWORD_RESET_REQUESTED'
  | 'ROLE_CHANGED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED'
  | 'UNAUTHORIZED_ACCESS' | 'RATE_LIMIT_TRIGGERED' | 'SUSPICIOUS_ACTIVITY'
  | 'ADMIN_SETTING_CHANGED' | 'FEATURE_FLAG_CHANGED'
  | 'BIOMETRIC_ENROLLED' | 'BIOMETRIC_DELETED'
  | 'DATA_EXPORT_REQUESTED' | 'DATA_EXPORT_DOWNLOADED'
  | 'ATTENDANCE_FRAUD_DETECTED' | 'BULK_ACTION_PERFORMED';

export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface LogEventOptions {
  type: SecurityEventType;
  severity?: SecuritySeverity;
  actorId?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  req?: Request;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** SHA-256 hash of a JWT token — safe to store, can verify without exposing token */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Extract safe device info from User-Agent string */
function parseDeviceInfo(userAgent?: string): string {
  if (!userAgent) return 'Unknown device';
  if (userAgent.includes('Mobile')) return 'Mobile Browser';
  if (userAgent.includes('Chrome')) return 'Chrome Browser';
  if (userAgent.includes('Firefox')) return 'Firefox Browser';
  if (userAgent.includes('Safari')) return 'Safari Browser';
  return 'Web Browser';
}

/** Get real IP from request (handles proxies) */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

// ─── Security Event Logging ───────────────────────────────────────────────────

/**
 * Log a security event. Fire-and-forget — never blocks the request.
 * Sensitive data (passwords, tokens, embeddings) must NEVER be in metadata.
 */
export async function logSecurityEvent(options: LogEventOptions): Promise<void> {
  try {
    const ip = options.req ? getClientIP(options.req) : undefined;
    const ua = options.req?.headers['user-agent'];
    const requestId = options.req?.headers['x-request-id'] as string | undefined;

    await prisma.securityEvent.create({
      data: {
        type: options.type as any,
        severity: (options.severity || 'INFO') as any,
        actorId: options.actorId,
        targetId: options.targetId,
        metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : undefined,
        ipAddress: ip,
        userAgent: ua ? ua.substring(0, 500) : undefined,
        requestId,
      }
    });
  } catch (err) {
    // Security logging must NEVER crash the main request
    console.error('[SecurityService] Failed to log event:', err);
  }
}

// ─── Session Management ───────────────────────────────────────────────────────

interface CreateSessionOptions {
  userId: string;
  token: string;
  req: Request;
  expiresInDays?: number;
}

/** Create a session record when a user logs in */
export async function createSession(opts: CreateSessionOptions): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (opts.expiresInDays || 7));

    await prisma.userSession.create({
      data: {
        userId: opts.userId,
        tokenHash: hashToken(opts.token),
        deviceInfo: parseDeviceInfo(opts.req.headers['user-agent']),
        ipAddress: getClientIP(opts.req),
        userAgent: opts.req.headers['user-agent']?.substring(0, 500),
        expiresAt,
      }
    });
  } catch (err) {
    console.error('[SecurityService] Failed to create session:', err);
  }
}

/** Check if a token's session has been explicitly revoked */
export async function isSessionRevoked(token: string): Promise<boolean> {
  try {
    const session = await prisma.userSession.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { revokedAt: true, expiresAt: true }
    });
    if (!session) return true; // No session record = revoked/unknown
    if (session.revokedAt) return true;
    if (session.expiresAt < new Date()) return true;
    return false;
  } catch {
    return false; // On error, don't block auth
  }
}

/** Update lastUsedAt for an active session (throttled) */
export async function touchSession(token: string): Promise<void> {
  try {
    await prisma.userSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { lastUsedAt: new Date() }
    });
  } catch { /* silent */ }
}

/** Revoke a specific session by token hash */
export async function revokeSession(token: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

/** Revoke all sessions for a user except optionally the current one */
export async function revokeAllSessions(userId: string, exceptToken?: string): Promise<number> {
  const where: any = { userId, revokedAt: null };
  if (exceptToken) {
    where.NOT = { tokenHash: hashToken(exceptToken) };
  }
  const result = await prisma.userSession.updateMany({
    where,
    data: { revokedAt: new Date() }
  });
  return result.count;
}

/** Get active sessions for a user (safe fields only) */
export async function getActiveSessions(userId: string) {
  return prisma.userSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
    orderBy: { lastUsedAt: 'desc' }
  });
}

// ─── Login Attempt Tracking ───────────────────────────────────────────────────

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

/** Record a login attempt */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  req: Request,
  failReason?: string
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ipAddress: getClientIP(req),
        success,
        failReason,
      }
    });
  } catch { /* silent */ }
}

/** Returns true if the email is temporarily locked out */
export async function isLockedOut(email: string): Promise<boolean> {
  try {
    const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000);
    const failCount = await prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: { gte: since }
      }
    });
    return failCount >= LOCKOUT_ATTEMPTS;
  } catch {
    return false;
  }
}

/** Returns minutes remaining in lockout (0 = not locked) */
export async function getLockoutMinutesRemaining(email: string): Promise<number> {
  try {
    const since = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000);
    const oldestFail = await prisma.loginAttempt.findFirst({
      where: { email: email.toLowerCase(), success: false, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });
    if (!oldestFail) return 0;
    const unlockAt = new Date(oldestFail.createdAt.getTime() + LOCKOUT_WINDOW_MINUTES * 60_000);
    const msLeft = unlockAt.getTime() - Date.now();
    return msLeft > 0 ? Math.ceil(msLeft / 60_000) : 0;
  } catch {
    return 0;
  }
}

export const securityService = {
  logSecurityEvent,
  createSession,
  isSessionRevoked,
  touchSession,
  revokeSession,
  revokeAllSessions,
  getActiveSessions,
  recordLoginAttempt,
  isLockedOut,
  getLockoutMinutesRemaining,
  hashToken,
};
