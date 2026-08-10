import { EventEmitter } from 'events';
import { prisma } from '../utils/prisma';
import { configurationService } from './configuration.service';
import { notificationService } from './notification.service';
import { analyticsService } from './analytics.service';
import { ATTENDANCE_RULES } from '../constants/attendance.rules';

export const attendanceEmitter = new EventEmitter();

// Helper to simulate sending an email
const sendEmail = (email: string, subject: string, body: string) => {
  console.log(`\n[EMAIL MOCK] To: ${email}`);
  console.log(`[EMAIL MOCK] Subject: ${subject}`);
  console.log(`[EMAIL MOCK] Body: ${body}\n`);
};

// 1. ATTENDANCE_MARKED event
attendanceEmitter.on('attendance.marked', async (data: { studentId: string, sessionId: string, status: string, method: string }) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { user: true }
    });
    const session = await prisma.attendanceSession.findUnique({
      where: { id: data.sessionId },
      include: { teachingAssignment: { include: { subject: true } } }
    });

    if (!student || !session) return;

    const pref = await notificationService.getPreferences(student.userId);
    if (!pref.attendanceAlertsEnabled) return;

    const subjectName = session.teachingAssignment.subject.name;
    const title = 'Attendance Marked';
    const message = `Your attendance has been marked as ${data.status} for ${subjectName} via ${data.method}.`;

    await notificationService.createNotification(
      student.userId,
      'ATTENDANCE_MARKED',
      title,
      message,
      'LOW',
      { sessionId: data.sessionId, method: data.method }
    );
  } catch (err) {
    console.error('Error handling attendance.marked event:', err);
  }
});

// 2. SESSION_CLOSED event (Threshold Checking Logic)
attendanceEmitter.on('session.closed', async (sessionId: string) => {
  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { teachingAssignment: { include: { subject: true } } }
    });
    if (!session) return;

    const classId = session.teachingAssignment.classId;
    const subjectId = session.teachingAssignment.subjectId;
    const subjectName = session.teachingAssignment.subject.name;

    const students = await prisma.student.findMany({
      where: { classId },
      include: { user: true }
    });

    // Run analytics for each student for this specific subject
    for (const student of students) {
      const records = await prisma.attendanceRecord.findMany({
        where: {
          studentId: student.id,
          session: { 
            teachingAssignmentId: session.teachingAssignmentId,
            status: ATTENDANCE_RULES.OFFICIAL_SESSION_STATUS as any
          }
        }
      });

      const totalSessions = records.length;
      if (totalSessions === 0) continue;

      let present = 0, late = 0;
      records.forEach(r => {
        if (r.status === 'PRESENT') present++;
        else if (r.status === 'LATE') late++;
      });

      const attended = present + (ATTENDANCE_RULES.LATE_COUNTS_AS_ATTENDED ? late : 0);
      const percentage = (attended / totalSessions) * 100;

      // Determine current status
      const warningThreshold = await configurationService.getSetting('WARNING_THRESHOLD', 75);
      const criticalThreshold = await configurationService.getSetting('CRITICAL_THRESHOLD', 60);

      let currentStatus: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
      if (percentage < criticalThreshold) currentStatus = 'CRITICAL';
      else if (percentage < warningThreshold) currentStatus = 'WARNING';

      // Find the last threshold notification sent for this subject
      const lastNotification = await prisma.notification.findFirst({
        where: {
          userId: student.userId,
          type: { in: ['ATTENDANCE_WARNING', 'CRITICAL_ATTENDANCE', 'ATTENDANCE_RECOVERY'] },
          metadata: { path: ['subjectId'], equals: subjectId }
        },
        orderBy: { createdAt: 'desc' }
      });

      const lastStatus = lastNotification?.type === 'CRITICAL_ATTENDANCE' ? 'CRITICAL' :
                         lastNotification?.type === 'ATTENDANCE_WARNING' ? 'WARNING' : 'SAFE';

      // Transition Logic
      if (currentStatus === 'WARNING' && lastStatus === 'SAFE') {
        const msg = `Your attendance in ${subjectName} has fallen below ${warningThreshold}%. Please improve your attendance.`;
        await notificationService.createNotification(student.userId, 'ATTENDANCE_WARNING', 'Low Attendance Warning', msg, 'HIGH', { subjectId });
        const pref = await notificationService.getPreferences(student.userId);
        if (pref.emailEnabled) sendEmail(student.user.email, 'Low Attendance Warning', msg);

      } else if (currentStatus === 'CRITICAL' && lastStatus !== 'CRITICAL') {
        const msg = `Your attendance in ${subjectName} is critically low (${percentage.toFixed(1)}%). Immediate action is required.`;
        await notificationService.createNotification(student.userId, 'CRITICAL_ATTENDANCE', 'Critical Attendance Alert', msg, 'CRITICAL', { subjectId });
        const pref = await notificationService.getPreferences(student.userId);
        if (pref.emailEnabled) sendEmail(student.user.email, 'CRITICAL Attendance Alert', msg);

      } else if (currentStatus === 'SAFE' && (lastStatus === 'WARNING' || lastStatus === 'CRITICAL')) {
        const msg = `Your attendance in ${subjectName} has improved and is now back in the safe range.`;
        await notificationService.createNotification(student.userId, 'ATTENDANCE_RECOVERY', 'Attendance Improved', msg, 'NORMAL', { subjectId });
      }
    }
  } catch (err) {
    console.error('Error handling session.closed event:', err);
  }
});
