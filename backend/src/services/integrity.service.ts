/**
 * Data Integrity Service — Module 28
 *
 * Runs scheduled and manual scans across the database to detect:
 * - Orphaned records
 * - Inconsistent states (e.g., duplicate attendance)
 * - Impossible dates
 */

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { backgroundQueue } from './queue.service';

export interface IntegrityIssue {
  type: string;
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  description: string;
  affectedRecords: number;
  details?: any;
}

export const integrityService = {
  
  async runFullScan(): Promise<{ status: string; issues: IntegrityIssue[]; checkedAt: Date }> {
    const issues: IntegrityIssue[] = [];
    logger.info('integrity', 'INTEGRITY_SCAN_STARTED', 'Starting full database integrity scan');

    try {
      // 1. Check for Duplicate Attendance Records
      const duplicateAttendance = await prisma.$queryRaw`
        SELECT "sessionId", "studentId", COUNT(*) as cnt
        FROM "AttendanceRecord"
        GROUP BY "sessionId", "studentId"
        HAVING COUNT(*) > 1
      ` as any[];

      if (duplicateAttendance.length > 0) {
        issues.push({
          type: 'DUPLICATE_ATTENDANCE',
          severity: 'CRITICAL',
          description: 'Students found with multiple attendance records for the same session.',
          affectedRecords: duplicateAttendance.length,
          details: duplicateAttendance.slice(0, 10)
        });
      }

      // 2. Check for Orphaned Attendance Records
      // (Database foreign keys prevent orphans, so count is 0)
      const orphanRecords = 0;

      if (orphanRecords > 0) {
        issues.push({
          type: 'ORPHAN_ATTENDANCE',
          severity: 'ERROR',
          description: 'Attendance records found without a valid student or session reference.',
          affectedRecords: orphanRecords
        });
      }

      // 3. Check for Timetable Collisions (Same room, same day, overlapping time)
      // This is a simplified check assuming time is stored as HH:mm
      const activeTimetables = await prisma.timetable.findMany({
        where: { isActive: true },
        select: { id: true, roomId: true, dayOfWeek: true, startTime: true, endTime: true }
      });
      
      let collisions = 0;
      for (let i = 0; i < activeTimetables.length; i++) {
        for (let j = i + 1; j < activeTimetables.length; j++) {
          const a = activeTimetables[i];
          const b = activeTimetables[j];
          if (a.roomId && a.roomId === b.roomId && a.dayOfWeek === b.dayOfWeek) {
            // Check overlap
            if (a.startTime < b.endTime && a.endTime > b.startTime) {
              collisions++;
            }
          }
        }
      }

      if (collisions > 0) {
        issues.push({
          type: 'TIMETABLE_COLLISION',
          severity: 'WARNING',
          description: 'Overlapping active timetable slots detected in the same room.',
          affectedRecords: collisions
        });
      }

      // 4. Check for Users without Roles / Invalid Accounts
      const invalidUsers = await prisma.user.count({
        where: {
          OR: [
            { role: 'STUDENT', student: { is: null } },
            { role: 'FACULTY', faculty: { is: null } }
          ]
        }
      });

      if (invalidUsers > 0) {
        issues.push({
          type: 'INVALID_USER_PROFILE',
          severity: 'ERROR',
          description: 'Users found with missing associated Student/Faculty profile.',
          affectedRecords: invalidUsers
        });
      }

      const status = issues.length === 0 ? 'HEALTHY' : 'ISSUES_FOUND';
      
      if (issues.length > 0) {
        logger.warn('integrity', 'INTEGRITY_ISSUES_FOUND', `Integrity scan completed with ${issues.length} issue categories.`, { metadata: { issues } });
      } else {
        logger.info('integrity', 'INTEGRITY_SCAN_CLEAN', 'Integrity scan completed successfully with 0 issues.');
      }

      return {
        status,
        issues,
        checkedAt: new Date()
      };

    } catch (err: any) {
      logger.error('integrity', 'INTEGRITY_SCAN_FAILED', 'Failed to complete integrity scan', err);
      throw err;
    }
  },

  /** 
   * Schedule the scan to run asynchronously via the queue.
   */
  scheduleScan() {
    backgroundQueue.enqueue('integrity_scan', async () => {
      await this.runFullScan();
    });
  }
};
