import cron from 'node-cron';
import { scheduleService } from './services/schedule.service';
import { prisma } from './utils/prisma';
import { notificationService } from './services/notification.service';
import { NotificationType, NotificationPriority } from '@prisma/client';

/**
 * Initializes all background jobs.
 */
export const initCronJobs = () => {
  // Run every night at midnight (00:00) to generate upcoming scheduled classes
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[CRON] Starting daily scheduled class generation...');
      const result = await scheduleService.generateScheduledClasses(new Date(), 30);
      console.log(`[CRON] ${result.message}`);
    } catch (error) {
      console.error('[CRON] Error generating scheduled classes:', error);
    }
  });

  // Run every 15 minutes to remind faculty of upcoming classes (within 30 mins)
  cron.schedule('*/15 * * * *', async () => {
    try {
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
          `Your class for ${cls.timetable.teachingAssignment.class.name} starts soon at ${cls.startTime.toLocaleTimeString()}. Please remember to start the attendance session.`,
          NotificationPriority.NORMAL
        );
      }
    } catch (error) {
      console.error('[CRON] Error sending faculty reminders:', error);
    }
  });

  // Run every 5 minutes to publish scheduled announcements
  cron.schedule('*/5 * * * *', async () => {
    try {
      const scheduled = await prisma.announcement.findMany({
        where: {
          status: 'SCHEDULED',
          publishAt: { lte: new Date() }
        }
      });
      
      for (const ann of scheduled) {
        console.log(`[CRON] Publishing scheduled announcement: ${ann.title}`);
        await import('./services/announcement.service').then(m => m.announcementService.publishAnnouncement(ann.id));
      }
    } catch (error) {
      console.error('[CRON] Error publishing scheduled announcements:', error);
    }
  });

  console.log('✅ Cron jobs initialized.');
};
