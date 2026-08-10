import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { attendanceService } from '../services/attendance.service';
import { sendSuccess, sendError } from '../utils/response';
import { AttendanceStatus } from '@prisma/client';

export const attendanceController = {
  
  // POST /sessions
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const schema = z.object({ teachingAssignmentId: z.string().uuid() });
      const { teachingAssignmentId } = schema.parse(req.body);

      const session = await attendanceService.createSession(userId, teachingAssignmentId);
      return sendSuccess(res, 201, session, 'Attendance session created');
    } catch (error: any) {
      if (error.message.includes('Forbidden')) return sendError(res, 403, error.message);
      next(error);
    }
  },

  // GET /sessions/:sessionId
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const sessionId = z.string().uuid().parse(req.params.sessionId);

      const session = await attendanceService.getSession(userId, sessionId);
      return sendSuccess(res, 200, session);
    } catch (error: any) {
      if (error.message.includes('Forbidden')) return sendError(res, 403, error.message);
      next(error);
    }
  },

  // GET /sessions/:sessionId/students
  async getSessionStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const sessionId = z.string().uuid().parse(req.params.sessionId);

      const students = await attendanceService.getSessionStudents(userId, sessionId);
      return sendSuccess(res, 200, students);
    } catch (error: any) {
      if (error.message.includes('Forbidden')) return sendError(res, 403, error.message);
      next(error);
    }
  },

  // PATCH /sessions/:sessionId/students/:studentId
  async markStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const sessionId = z.string().uuid().parse(req.params.sessionId);
      const studentId = z.string().uuid().parse(req.params.studentId);
      
      const schema = z.object({ 
        status: z.enum([AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED]) 
      });
      const { status } = schema.parse(req.body);

      const record = await attendanceService.markStudentAttendance(userId, sessionId, studentId, status);
      return sendSuccess(res, 200, record, 'Attendance recorded');
    } catch (error: any) {
      if (error.message.includes('Forbidden')) return sendError(res, 403, error.message);
      if (error.message.includes('closed')) return sendError(res, 422, error.message);
      next(error);
    }
  },

  // POST /sessions/:sessionId/records (Bulk)
  async bulkMarkAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const sessionId = z.string().uuid().parse(req.params.sessionId);
      
      const schema = z.object({
        records: z.array(z.object({
          studentId: z.string().uuid(),
          status: z.enum([AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED])
        }))
      });
      const { records } = schema.parse(req.body);

      const result = await attendanceService.bulkMarkAttendance(userId, sessionId, records);
      return sendSuccess(res, 200, result, 'Bulk attendance saved successfully');
    } catch (error: any) {
      if (error.message.includes('Forbidden')) return sendError(res, 403, error.message);
      if (error.message.includes('closed')) return sendError(res, 422, error.message);
      next(error);
    }
  },

  // POST /sessions/:sessionId/close
  async closeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const sessionId = z.string().uuid().parse(req.params.sessionId);

      const session = await attendanceService.closeSession(userId, sessionId);
      return sendSuccess(res, 200, session, 'Session closed successfully');
    } catch (error: any) {
      if (error.message.includes('Forbidden')) return sendError(res, 403, error.message);
      if (error.message.includes('OPEN')) return sendError(res, 422, error.message);
      next(error);
    }
  },

  // GET /student/history
  async getStudentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const history = await attendanceService.getStudentHistory(userId);
      return sendSuccess(res, 200, history);
    } catch (error) {
      next(error);
    }
  }
};
