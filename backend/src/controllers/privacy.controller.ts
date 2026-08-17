/**
 * Privacy Controller — Module 25
 *
 * Handles GDPR-style data export and privacy preferences.
 * Users can export their own data. Admins cannot export other users' data via this endpoint.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { prisma } from '../utils/prisma';
import { securityService } from '../services/security.service';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export const privacyController = {

  /**
   * Request a personal data export.
   * Collects: profile, attendance, goals, achievements, tickets.
   * Returns a JSON export — in production this would be async with email delivery.
   */
  async requestExport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // Check for recent pending export (prevent abuse)
      const recentExport = await prisma.dataExportRequest.findFirst({
        where: {
          userId,
          status: { in: ['PENDING', 'PROCESSING', 'READY'] },
          requestedAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) }
        }
      });
      if (recentExport) {
        return sendError(res, 429, 'An export was already requested in the last 24 hours.', 'EXPORT_RATE_LIMIT');
      }

      // Create export request record
      const exportRecord = await prisma.dataExportRequest.create({
        data: { userId, status: 'PROCESSING' }
      });

      // Build the export synchronously (in production: queue a background job)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, name: true, role: true, createdAt: true,
          student: {
            select: {
              studentId: true,
              attendanceRecords: {
                select: { status: true, markedAt: true, session: { select: { date: true } } },
                take: 500
              },
              goals: { select: { goalType: true, targetPercentage: true, status: true, createdAt: true } },
              achievements: { select: { earnedAt: true, achievement: { select: { name: true, description: true } } } },
            }
          },
          createdTickets: {
            select: { ticketNumber: true, category: true, subject: true, status: true, createdAt: true },
            take: 100
          }
        }
      });

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0',
        requestId: exportRecord.id,
        notice: 'This is your personal data as stored in AttendX. Handle it securely.',
        profile: {
          id: user?.id, email: user?.email, name: user?.name,
          role: user?.role, accountCreated: user?.createdAt
        },
        attendance: user?.student?.attendanceRecords || [],
        goals: user?.student?.goals || [],
        achievements: user?.student?.achievements || [],
        supportTickets: user?.createdTickets || [],
      };

      // Mark complete
      await prisma.dataExportRequest.update({
        where: { id: exportRecord.id },
        data: {
          status: 'DOWNLOADED',
          completedAt: new Date(),
          downloadedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60_000) // 1 hour
        }
      });

      await securityService.logSecurityEvent({
        type: 'DATA_EXPORT_REQUESTED', severity: 'LOW',
        actorId: userId, metadata: { exportId: exportRecord.id }, req
      });

      // Return export directly (in production: signed URL to temp file)
      res.setHeader('Content-Disposition', `attachment; filename="attendx-export-${Date.now()}.json"`);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store, no-cache');
      return res.status(200).json(exportPayload);

    } catch (error) { next(error); }
  },

  /**
   * Get/update privacy preferences.
   */
  async getPrivacySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: req.user!.userId },
        select: {
          emailEnabled: true,
          attendanceAlertsEnabled: true,
          systemAlertsEnabled: true,
        }
      });
      return sendSuccess(res, 200, { preferences: prefs || {} }, 'Privacy settings retrieved.');
    } catch (error) { next(error); }
  },

  async updatePrivacySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { emailEnabled, attendanceAlertsEnabled, systemAlertsEnabled } = req.body;

      const updated = await prisma.notificationPreference.upsert({
        where: { userId: req.user!.userId },
        update: {
          ...(emailEnabled !== undefined && { emailEnabled: Boolean(emailEnabled) }),
          ...(attendanceAlertsEnabled !== undefined && { attendanceAlertsEnabled: Boolean(attendanceAlertsEnabled) }),
          ...(systemAlertsEnabled !== undefined && { systemAlertsEnabled: Boolean(systemAlertsEnabled) }),
        },
        create: {
          userId: req.user!.userId,
          emailEnabled: Boolean(emailEnabled),
          attendanceAlertsEnabled: attendanceAlertsEnabled !== false,
          systemAlertsEnabled: systemAlertsEnabled !== false,
        },
        select: { emailEnabled: true, attendanceAlertsEnabled: true, systemAlertsEnabled: true }
      });

      return sendSuccess(res, 200, { preferences: updated }, 'Privacy settings updated.');
    } catch (error) { next(error); }
  },
};
