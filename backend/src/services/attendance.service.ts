import { prisma } from '../utils/prisma';
import { SessionStatus, AttendanceStatus } from '@prisma/client';

export const attendanceService = {

  // 1. Create Session
  async createSession(facultyUserId: string, teachingAssignmentId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId: facultyUserId } });
    if (!faculty) throw new Error('Faculty not found');

    const assignment = await prisma.teachingAssignment.findUnique({
      where: { id: teachingAssignmentId },
      include: { class: true, subject: true }
    });

    if (!assignment) throw new Error('Teaching assignment not found');
    if (assignment.facultyId !== faculty.id) throw new Error('Forbidden: You do not own this teaching assignment');
    if (!assignment.class.isActive || !assignment.subject.isActive) throw new Error('Cannot start session for inactive class or subject');

    // Create session (Store dates in UTC)
    return await prisma.attendanceSession.create({
      data: {
        teachingAssignmentId,
        date: new Date(),
        startTime: new Date(),
        createdBy: faculty.id,
        status: SessionStatus.OPEN
      },
      include: {
        teachingAssignment: {
          include: { class: true, subject: true }
        }
      }
    });
  },

  // 2. Get Session Details
  async getSession(facultyUserId: string, sessionId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId: facultyUserId } });
    if (!faculty) throw new Error('Faculty not found');

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        teachingAssignment: {
          include: { class: true, subject: true, semester: true, academicYear: true }
        }
      }
    });

    if (!session) throw new Error('Session not found');
    if (session.teachingAssignment.facultyId !== faculty.id) {
      throw new Error('Forbidden: You are not authorized to access this session');
    }

    return session;
  },

  // 3. Get Session Students with current Attendance Records
  async getSessionStudents(facultyUserId: string, sessionId: string) {
    const session = await this.getSession(facultyUserId, sessionId); // also handles auth
    const classId = session.teachingAssignment.classId;

    // Get all active students for this class
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        user: { select: { name: true, email: true, status: true } },
      },
      orderBy: { studentId: 'asc' }
    });

    // Get existing attendance records for this session
    const records = await prisma.attendanceRecord.findMany({
      where: { sessionId }
    });

    // Map records to students
    const recordMap = new Map(records.map(r => [r.studentId, r]));

    return students.map(student => {
      const record = recordMap.get(student.id);
      return {
        ...student,
        attendanceStatus: record?.status || null,
        markedAt: record?.markedAt || null,
        markedBy: record?.markedBy || null
      };
    });
  },

  // 4. Mark Single Student
  async markStudentAttendance(facultyUserId: string, sessionId: string, studentId: string, status: AttendanceStatus) {
    const session = await this.getSession(facultyUserId, sessionId);
    if (session.status !== SessionStatus.OPEN) throw new Error('Session is closed or cancelled');

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student || student.classId !== session.teachingAssignment.classId) {
      throw new Error('Student does not belong to this class');
    }

    const record = await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentId: { sessionId, studentId }
      },
      update: {
        status,
        markedAt: new Date(),
        markedBy: facultyUserId
      },
      create: {
        sessionId,
        studentId,
        status,
        markedAt: new Date(),
        markedBy: facultyUserId
      }
    });

    import('./notification.events').then(({ attendanceEmitter }) => {
      attendanceEmitter.emit('attendance.marked', {
        studentId,
        sessionId,
        status,
        method: 'Manual'
      });
    });

    return record;
  },

  // 5. Bulk Mark Attendance (Atomic Transaction)
  async bulkMarkAttendance(facultyUserId: string, sessionId: string, records: { studentId: string, status: AttendanceStatus }[]) {
    const session = await this.getSession(facultyUserId, sessionId);
    if (session.status !== SessionStatus.OPEN) throw new Error('Session is closed or cancelled');

    // Verify all students belong to the class
    const classId = session.teachingAssignment.classId;
    const studentIds = records.map(r => r.studentId);
    const validStudents = await prisma.student.findMany({
      where: { id: { in: studentIds }, classId }
    });

    if (validStudents.length !== records.length) {
      throw new Error('One or more students do not belong to this class or do not exist');
    }

    // Atomic transaction: if any upsert fails, the entire block rolls back
    const results = await prisma.$transaction(
      records.map(record => 
        prisma.attendanceRecord.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId: record.studentId }
          },
          update: {
            status: record.status,
            markedAt: new Date(),
            markedBy: facultyUserId
          },
          create: {
            sessionId,
            studentId: record.studentId,
            status: record.status,
            markedAt: new Date(),
            markedBy: facultyUserId
          }
        })
      )
    );

    import('./notification.events').then(({ attendanceEmitter }) => {
      records.forEach(r => {
        attendanceEmitter.emit('attendance.marked', {
          studentId: r.studentId,
          sessionId,
          status: r.status,
          method: 'Manual Bulk'
        });
      });
    });

    return results;
  },

  // 6. Close Session
  async closeSession(facultyUserId: string, sessionId: string) {
    const session = await this.getSession(facultyUserId, sessionId);
    if (session.status !== SessionStatus.OPEN) throw new Error('Only OPEN sessions can be closed');

    const closedSession = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.CLOSED,
        endTime: new Date()
      }
    });

    import('./notification.events').then(({ attendanceEmitter }) => {
      attendanceEmitter.emit('session.closed', sessionId);
    });

    return closedSession;
  },

  // 7. Get Student History
  async getStudentHistory(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new Error('Student not found');

    return await prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: {
        session: {
          include: {
            teachingAssignment: {
              include: { subject: true, class: true }
            }
          }
        }
      },
      orderBy: { session: { date: 'desc' } }
    });
  }
};
