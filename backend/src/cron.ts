/**
 * Background Jobs (Cron) — Module 26 Instrumented
 *
 * All jobs are wrapped with:
 * - Job start/complete/fail metrics
 * - Structured logging with duration
 * - Error isolation (one job failure never kills others)
 */

import cron from 'node-cron';
import { scheduleService } from './services/schedule.service';
import { prisma } from './utils/prisma';
import { integrityService } from './services/integrity.service';
import { notificationService } from './services/notification.service';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { logger } from './utils/logger';
import { metrics } from './services/metrics.service';

/** Wraps a job function with timing, logging, and metrics */
async function runJob(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  metrics.jobStarted(name);
  logger.info('cron', 'JOB_STARTED', `Job started: ${name}`);

  try {
    await fn();
    const duration = Date.now() - start;
    metrics.jobCompleted(name, duration);
    logger.info('cron', 'JOB_COMPLETED', `Job completed: ${name}`, { duration });
  } catch (error: any) {
    const duration = Date.now() - start;
    metrics.jobFailed(name);
    logger.error('cron', 'JOB_FAILED', `Job failed: ${name}`, error instanceof Error ? error : undefined,
      { duration });
  }
}

export const initCronJobs = () => {

  // ── Daily class generation (midnight) ─────────────────────────────────────
  cron.schedule('0 0 * * *', () => runJob('class_generation', async () => {
    const result = await scheduleService.generateScheduledClasses(new Date(), 30);
    logger.info('cron', 'JOB_COMPLETED', result.message);
  }));

  // ── Faculty reminders (every 15 min) ──────────────────────────────────────
  cron.schedule('*/15 * * * *', () => runJob('faculty_reminders', async () => {
    const now = new Date();
    const in30Mins = new Date(now.getTime() + 30 * 60000);

    const upcoming = await prisma.scheduledClass.findMany({
      where: {
        startTime: { gt: now, lte: in30Mins },
        status: 'SCHEDULED',
        attendanceSession: null
      },
      include: {
        timetable: {
          include: { teachingAssignment: { include: { faculty: true, subject: true, class: true } } }
        }
      }
    });

    for (const cls of upcoming) {
      await notificationService.createNotification(
        cls.timetable.teachingAssignment.faculty.userId,
        NotificationType.SYSTEM_NOTICE,
        `Upcoming Class: ${cls.timetable.teachingAssignment.subject.name}`,
        `Your class for ${cls.timetable.teachingAssignment.class.name} starts soon at ${cls.startTime.toLocaleTimeString()}.`,
        NotificationPriority.NORMAL
      );
    }

    logger.info('cron', 'JOB_COMPLETED', `Faculty reminders: ${upcoming.length} sent`);
  }));

  // ── Announcement publishing (every 5 min) ─────────────────────────────────
  cron.schedule('*/5 * * * *', () => runJob('announcement_publisher', async () => {
    const scheduled = await prisma.announcement.findMany({
      where: { status: 'SCHEDULED', publishAt: { lte: new Date() } }
    });

    for (const ann of scheduled) {
      await import('./services/announcement.service').then(m => m.announcementService.publishAnnouncement(ann.id));
    }

    if (scheduled.length > 0) {
      logger.info('cron', 'JOB_COMPLETED', `Published ${scheduled.length} announcement(s)`);
    }
  }));

  // ── Session cleanup — expired UserSessions (daily 2:00 AM) ────────────────
  cron.schedule('0 2 * * *', () => runJob('session_cleanup', async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60_000); // 30 days ago
    const result = await prisma.userSession.deleteMany({
      where: { OR: [{ expiresAt: { lt: cutoff } }, { revokedAt: { lt: cutoff } }] }
    });
    logger.info('cron', 'JOB_COMPLETED', `Session cleanup: deleted ${result.count} expired sessions`);
  }));

  // ── Login attempt cleanup (daily 2:30 AM) ─────────────────────────────────
  cron.schedule('30 2 * * *', () => runJob('login_attempt_cleanup', async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60_000);
    const result = await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
    logger.info('cron', 'JOB_COMPLETED', `Login attempt cleanup: deleted ${result.count} records`);
  }));

  // ── Notification cleanup — old read notifications (daily 3:00 AM) ─────────
  cron.schedule('0 3 * * *', () => runJob('notification_cleanup', async () => {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60_000); // 90 days
    const result = await prisma.notification.deleteMany({
      where: { readAt: { not: null, lt: cutoff } }
    });
    logger.info('cron', 'JOB_COMPLETED', `Notification cleanup: deleted ${result.count} old notifications`);
  }));

  // ── AppLog cleanup — old WARN/ERROR logs (weekly Sunday 4:00 AM) ──────────
  cron.schedule('0 4 * * 0', () => runJob('applog_cleanup', async () => {
    const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60_000); // 1 year
    const result = await prisma.appLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    logger.info('cron', 'JOB_COMPLETED', `AppLog cleanup: archived ${result.count} old log entries`);
  }));

  // ── Data Integrity Scan (daily 2:00 AM) ──────────────────────────────────
  cron.schedule('0 2 * * *', () => runJob('integrity_scan', async () => {
    await integrityService.runFullScan();
  }));

  logger.info('cron', 'APPLICATION_STARTED', 'All cron jobs initialized (7 jobs registered)');
};
