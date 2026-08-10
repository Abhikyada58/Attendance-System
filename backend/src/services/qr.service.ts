import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import { AttendanceStatus } from '@prisma/client';

const QR_TOKEN_TTL_SECONDS = 60;

export const qrService = {

  // Generate a new QR Token for a specific session
  async generateToken(facultyUserId: string, sessionId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId: facultyUserId } });
    if (!faculty) throw new Error('Faculty not found');

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { teachingAssignment: true }
    });

    if (!session) throw new Error('Session not found');
    if (session.teachingAssignment.facultyId !== faculty.id) {
      throw new Error('Forbidden: You do not own this session');
    }
    if (session.status !== 'OPEN') {
      throw new Error('Cannot generate QR for a closed or cancelled session');
    }

    // Revoke any existing active tokens for this session (Rotation)
    await prisma.qRCodeToken.updateMany({
      where: {
        sessionId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      data: { revokedAt: new Date() }
    });

    // Generate secure cryptographically random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + QR_TOKEN_TTL_SECONDS * 1000);

    await prisma.qRCodeToken.create({
      data: {
        sessionId,
        tokenHash,
        expiresAt
      }
    });

    return { token: rawToken, expiresAt };
  },

  // Revoke the active token
  async revokeToken(facultyUserId: string, sessionId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId: facultyUserId } });
    if (!faculty) throw new Error('Faculty not found');

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { teachingAssignment: true }
    });

    if (!session || session.teachingAssignment.facultyId !== faculty.id) {
      throw new Error('Forbidden: You do not own this session');
    }

    await prisma.qRCodeToken.updateMany({
      where: {
        sessionId,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });

    return { success: true };
  },

  // Get active token status
  async getTokenStatus(facultyUserId: string, sessionId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId: facultyUserId } });
    if (!faculty) throw new Error('Faculty not found');

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: { teachingAssignment: true }
    });

    if (!session || session.teachingAssignment.facultyId !== faculty.id) {
      throw new Error('Forbidden: You do not own this session');
    }

    const activeToken = await prisma.qRCodeToken.findFirst({
      where: {
        sessionId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (!activeToken) return { active: false };
    
    return {
      active: true,
      expiresAt: activeToken.expiresAt
    };
  },

  // Student scans and submits token
  async scanToken(studentUserId: string, rawToken: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) throw new Error('UNAUTHORIZED: Student profile not found');

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const qrToken = await prisma.qRCodeToken.findUnique({
      where: { tokenHash },
      include: {
        session: {
          include: { teachingAssignment: true }
        }
      }
    });

    if (!qrToken) throw new Error('INVALID_QR: QR code not recognized');
    if (qrToken.revokedAt) throw new Error('QR_REVOKED: This QR code has been revoked by the faculty');
    if (new Date() > qrToken.expiresAt) throw new Error('QR_EXPIRED: QR code expired. Please scan the latest one.');
    
    const session = qrToken.session;
    if (session.status !== 'OPEN') throw new Error('SESSION_CLOSED: This attendance session is no longer open');

    if (student.classId !== session.teachingAssignment.classId) {
      throw new Error('WRONG_CLASS: You are not enrolled in the class for this session');
    }

    // Check for duplicate safely and insert if not exists
    // We use a transaction to prevent race conditions during double scanning
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.attendanceRecord.findUnique({
        where: {
          sessionId_studentId: { sessionId: session.id, studentId: student.id }
        }
      });

      if (existing) {
        throw new Error('ALREADY_MARKED: Attendance already marked for this session.');
      }

      const newRecord = await tx.attendanceRecord.create({
        data: {
          sessionId: session.id,
          studentId: student.id,
          status: AttendanceStatus.PRESENT,
          markedAt: new Date(),
          markedBy: 'SYSTEM_QR'
        }
      });

      // Fire notification event asynchronously
      import('./notification.events').then(({ attendanceEmitter }) => {
        attendanceEmitter.emit('attendance.marked', {
          studentId: student.id,
          sessionId: session.id,
          status: 'PRESENT',
          method: 'QR Code'
        });
      });

      return newRecord;
    });
  }
};
