import { prisma } from '../utils/prisma';
import { LeaveType, WorkflowStatus, AttendanceStatus, NotificationType, NotificationPriority } from '@prisma/client';
import { notificationService } from './notification.service';
import { attendanceEmitter } from './notification.events'; // Trigger analytics updates

export const workflowService = {

  // ==========================================
  // LEAVE REQUESTS
  // ==========================================

  async createLeaveRequest(data: { studentId: string; startDate: Date; endDate: Date; leaveType: LeaveType; reason: string; attachmentUrl?: string }) {
    if (data.startDate > data.endDate) throw new Error('Start date must be before end date');
    
    // Check for overlap
    const existing = await prisma.leaveRequest.findFirst({
      where: {
        studentId: data.studentId,
        status: { in: ['PENDING', 'APPROVED'] },
        AND: [
          { startDate: { lte: data.endDate } },
          { endDate: { gte: data.startDate } }
        ]
      }
    });

    if (existing) throw new Error('Leave request overlaps with an existing pending or approved request');

    return prisma.leaveRequest.create({ data });
  },

  async getLeaveRequests(filters: any) {
    return prisma.leaveRequest.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        reviewer: { select: { name: true } }
      }
    });
  },

  async processLeaveRequest(id: string, reviewerId: string, status: WorkflowStatus, comment?: string) {
    if (status !== 'APPROVED' && status !== 'REJECTED') throw new Error('Invalid status');

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { student: { include: { user: true } } }
    });
    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING') throw new Error('Request is already processed');

    // Perform transaction
    const updated = await prisma.$transaction(async (tx) => {
      const leave = await tx.leaveRequest.update({
        where: { id },
        data: { status, reviewerId, reviewComment: comment, reviewedAt: new Date() }
      });

      if (status === 'APPROVED') {
        // Business Rule: Update any existing attendance records in this window to EXCUSED if they were ABSENT
        await tx.attendanceRecord.updateMany({
          where: {
            studentId: request.studentId,
            status: 'ABSENT',
            session: {
              date: { gte: request.startDate, lte: request.endDate }
            }
          },
          data: { status: 'EXCUSED' }
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: reviewerId,
          action: `LEAVE_REQUEST_${status}`,
          entityType: 'LeaveRequest',
          entityId: id,
          metadata: { comment }
        }
      });

      return leave;
    });

    // Notify student
    await notificationService.createNotification(
      request.student.userId,
      NotificationType.SYSTEM_NOTICE,
      `Leave Request ${status}`,
      `Your leave request from ${request.startDate.toLocaleDateString()} to ${request.endDate.toLocaleDateString()} was ${status.toLowerCase()}.`,
      NotificationPriority.NORMAL,
      { requestId: id, status }
    );

    return updated;
  },

  // ==========================================
  // ATTENDANCE CORRECTIONS
  // ==========================================

  async createCorrectionRequest(data: { attendanceRecordId: string; studentId: string; requestedStatus: AttendanceStatus; reason: string; attachmentUrl?: string }) {
    // Check if there is already a pending request
    const existing = await prisma.attendanceCorrectionRequest.findFirst({
      where: { attendanceRecordId: data.attendanceRecordId, status: 'PENDING' }
    });
    if (existing) throw new Error('A correction request for this record is already pending');

    return prisma.attendanceCorrectionRequest.create({ data });
  },

  async getCorrectionRequests(filters: any) {
    return prisma.attendanceCorrectionRequest.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        reviewer: { select: { name: true } },
        attendanceRecord: {
          include: {
            session: {
              include: { teachingAssignment: { include: { subject: true, class: true } } }
            }
          }
        }
      }
    });
  },

  async processCorrectionRequest(id: string, reviewerId: string, status: WorkflowStatus, comment?: string) {
    if (status !== 'APPROVED' && status !== 'REJECTED') throw new Error('Invalid status');

    const request = await prisma.attendanceCorrectionRequest.findUnique({
      where: { id },
      include: {
        attendanceRecord: { include: { session: true } },
        student: { include: { user: true } }
      }
    });
    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING') throw new Error('Request is already processed');

    // Perform transaction
    const updated = await prisma.$transaction(async (tx) => {
      const correction = await tx.attendanceCorrectionRequest.update({
        where: { id },
        data: { status, reviewerId, reviewComment: comment, reviewedAt: new Date() }
      });

      if (status === 'APPROVED') {
        // Update the canonical attendance record
        await tx.attendanceRecord.update({
          where: { id: request.attendanceRecordId },
          data: { status: request.requestedStatus, markedBy: reviewerId, markedAt: new Date() }
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: reviewerId,
          action: `CORRECTION_REQUEST_${status}`,
          entityType: 'AttendanceCorrectionRequest',
          entityId: id,
          metadata: { 
            oldStatus: request.attendanceRecord.status,
            newStatus: request.requestedStatus,
            comment 
          }
        }
      });

      return correction;
    });

    // Fire event so Analytics can refresh
    if (status === 'APPROVED') {
      attendanceEmitter.emit('session.closed', request.attendanceRecord.sessionId);
    }

    // Notify student
    await notificationService.createNotification(
      request.student.userId,
      NotificationType.SYSTEM_NOTICE,
      `Attendance Correction ${status}`,
      `Your request to change attendance to ${request.requestedStatus} was ${status.toLowerCase()}.`,
      NotificationPriority.NORMAL,
      { requestId: id, status }
    );

    return updated;
  }
};
