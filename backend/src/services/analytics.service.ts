import { prisma } from '../utils/prisma';
import { ATTENDANCE_RULES, calculatePercentage, determineStatus } from '../constants/attendance.rules';
import { configurationService } from './configuration.service';
import { AttendanceStatus } from '@prisma/client';

export const analyticsService = {
  // ---------------------------------------------------------
  // STUDENT ANALYTICS
  // ---------------------------------------------------------

  async getStudentOverview(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new Error('Student not found');

    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        session: { status: ATTENDANCE_RULES.OFFICIAL_SESSION_STATUS as any }
      },
      include: {
        session: { select: { date: true, teachingAssignmentId: true } }
      }
    });

    let present = 0, absent = 0, late = 0;
    records.forEach(r => {
      if (r.status === AttendanceStatus.PRESENT) present++;
      else if (r.status === AttendanceStatus.ABSENT) absent++;
      else if (r.status === AttendanceStatus.LATE) late++;
    });

    const attended = present + (ATTENDANCE_RULES.LATE_COUNTS_AS_ATTENDED ? late : 0);
    const applicable = records.length;
    const percentage = calculatePercentage(attended, applicable);
    const status = await determineStatus(percentage, applicable);

    return {
      totalSessions: applicable,
      present,
      absent,
      late,
      attendancePercentage: percentage,
      status
    };
  },

  async getStudentSubjects(userId: string, startDate?: string, endDate?: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new Error('Student not found');

    const sessionWhere: any = { status: ATTENDANCE_RULES.OFFICIAL_SESSION_STATUS as any };
    if (startDate || endDate) {
      sessionWhere.date = {};
      if (startDate) sessionWhere.date.gte = new Date(startDate);
      if (endDate) sessionWhere.date.lte = new Date(endDate);
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        session: sessionWhere
      },
      include: {
        session: {
          include: {
            teachingAssignment: {
              include: { subject: true }
            }
          }
        }
      }
    });

    const subjectMap = new Map();
    records.forEach(r => {
      const subject = r.session.teachingAssignment.subject;
      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          id: subject.id,
          code: subject.code,
          name: subject.name,
          totalSessions: 0,
          present: 0,
          absent: 0,
          late: 0
        });
      }
      
      const stats = subjectMap.get(subject.id);
      stats.totalSessions++;
      if (r.status === AttendanceStatus.PRESENT) stats.present++;
      else if (r.status === AttendanceStatus.ABSENT) stats.absent++;
      else if (r.status === AttendanceStatus.LATE) stats.late++;
    });

    const results = await Promise.all(Array.from(subjectMap.values()).map(async (stats: any) => {
      const attended = stats.present + (ATTENDANCE_RULES.LATE_COUNTS_AS_ATTENDED ? stats.late : 0);
      stats.attendancePercentage = calculatePercentage(attended, stats.totalSessions);
      stats.status = await determineStatus(stats.attendancePercentage, stats.totalSessions);
      return stats;
    }));

    return results;
  },

  async getStudentMonthly(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new Error('Student not found');

    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        session: { status: ATTENDANCE_RULES.OFFICIAL_SESSION_STATUS as any }
      },
      include: {
        session: { select: { date: true } }
      },
      orderBy: { session: { date: 'asc' } }
    });

    const monthlyMap = new Map();
    records.forEach(r => {
      const date = new Date(r.session.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!monthlyMap.has(monthYear)) {
        monthlyMap.set(monthYear, { month: monthYear, total: 0, attended: 0, present: 0, absent: 0, late: 0 });
      }
      
      const stats = monthlyMap.get(monthYear);
      stats.total++;
      if (r.status === AttendanceStatus.PRESENT) { stats.present++; stats.attended++; }
      else if (r.status === AttendanceStatus.ABSENT) { stats.absent++; }
      else if (r.status === AttendanceStatus.LATE) { 
        stats.late++; 
        if (ATTENDANCE_RULES.LATE_COUNTS_AS_ATTENDED) stats.attended++; 
      }
    });

    return Array.from(monthlyMap.values()).map((stats: any) => ({
      ...stats,
      percentage: calculatePercentage(stats.attended, stats.total)
    }));
  },

  // ---------------------------------------------------------
  // FACULTY ANALYTICS
  // ---------------------------------------------------------

  async getFacultyOverview(userId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new Error('Faculty not found');

    const assignments = await prisma.teachingAssignment.findMany({
      where: { facultyId: faculty.id },
      select: { id: true, subjectId: true, classId: true }
    });

    const assignmentIds = assignments.map(a => a.id);
    const uniqueSubjects = new Set(assignments.map(a => a.subjectId)).size;
    const uniqueClasses = new Set(assignments.map(a => a.classId)).size;

    const sessions = await prisma.attendanceSession.findMany({
      where: { teachingAssignmentId: { in: assignmentIds } },
      include: { records: true }
    });

    let totalSessions = sessions.length;
    let closedSessions = sessions.filter(s => s.status === ATTENDANCE_RULES.OFFICIAL_SESSION_STATUS).length;
    
    let totalRecords = 0;
    let totalAttended = 0;

    sessions.forEach(s => {
      if (s.status === ATTENDANCE_RULES.OFFICIAL_SESSION_STATUS as any) {
        s.records.forEach(r => {
          totalRecords++;
          if (r.status === AttendanceStatus.PRESENT || (ATTENDANCE_RULES.LATE_COUNTS_AS_ATTENDED && r.status === AttendanceStatus.LATE)) {
            totalAttended++;
          }
        });
      }
    });

    return {
      totalClasses: uniqueClasses,
      totalSubjects: uniqueSubjects,
      sessionsConducted: totalSessions,
      officialSessions: closedSessions,
      averageAttendance: calculatePercentage(totalAttended, totalRecords)
    };
  },

  async getFacultyClasses(userId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new Error('Faculty not found');

    const assignments = await prisma.teachingAssignment.findMany({
      where: { facultyId: faculty.id },
      include: {
        subject: true,
        class: { include: { students: true } },
        attendanceSessions: {
          where: { status: ATTENDANCE_RULES.OFFICIAL_SESSION_STATUS as any },
          include: { records: true }
        }
      }
    });

    return Promise.all(assignments.map(async assignment => {
      let totalRecords = 0;
      let attendedRecords = 0;

      // Group by student to calculate below-threshold students
      const studentMap = new Map();

      assignment.attendanceSessions.forEach(session => {
        session.records.forEach(record => {
          totalRecords++;
          const isAttended = record.status === AttendanceStatus.PRESENT || 
                             (ATTENDANCE_RULES.LATE_COUNTS_AS_ATTENDED && record.status === AttendanceStatus.LATE);
          if (isAttended) attendedRecords++;

          if (!studentMap.has(record.studentId)) {
            studentMap.set(record.studentId, { total: 0, attended: 0 });
          }
          const sStats = studentMap.get(record.studentId);
          sStats.total++;
          if (isAttended) sStats.attended++;
        });
      });

      let belowThresholdCount = 0;
      const warningThreshold = await configurationService.getSetting('WARNING_THRESHOLD', 75);
      studentMap.forEach(stats => {
        const pct = calculatePercentage(stats.attended, stats.total);
        if (pct < warningThreshold) belowThresholdCount++;
      });

      return {
        classId: assignment.class.id,
        className: assignment.class.name,
        subjectName: assignment.subject.name,
        totalStudents: assignment.class.students.length,
        totalSessions: assignment.attendanceSessions.length,
        averageAttendance: calculatePercentage(attendedRecords, totalRecords),
        studentsBelowThreshold: belowThresholdCount
      };
    }));
  }
};
