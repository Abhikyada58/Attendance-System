import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { facultyService } from '../services/faculty.service';
import { sendSuccess, sendError } from '../utils/response';

export const facultyController = {
  // GET /me
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const profile = await facultyService.getFacultyProfile(userId);
      return sendSuccess(res, 200, profile);
    } catch (error) { next(error); }
  },

  // PATCH /me
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const schema = z.object({ name: z.string().min(2).optional() });
      const data = schema.parse(req.body);
      
      const result = await facultyService.updateFacultyProfile(userId, data);
      return sendSuccess(res, 200, result, 'Profile updated successfully');
    } catch (error) { next(error); }
  },

  // GET /me/assignments
  async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const assignments = await facultyService.getFacultyAssignments(userId);
      return sendSuccess(res, 200, assignments);
    } catch (error) { next(error); }
  },

  // GET /me/assignments/:assignmentId
  async getAssignmentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const assignmentId = z.string().uuid().parse(req.params.assignmentId);
      
      const details = await facultyService.getFacultyAssignmentDetails(userId, assignmentId);
      return sendSuccess(res, 200, details);
    } catch (error: any) { 
      if (error.message.includes('Forbidden')) return sendError(res, 403, error.message);
      next(error); 
    }
  },

  // GET /me/subjects
  async getSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const subjects = await facultyService.getFacultySubjects(userId);
      return sendSuccess(res, 200, subjects);
    } catch (error) { next(error); }
  },

  // GET /me/classes
  async getClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const classes = await facultyService.getFacultyClasses(userId);
      return sendSuccess(res, 200, classes);
    } catch (error) { next(error); }
  },

  // GET /me/classes/:classId/students
  async getClassStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const classId = z.string().uuid().parse(req.params.classId);
      
      const students = await facultyService.getClassStudents(userId, classId);
      return sendSuccess(res, 200, students);
    } catch (error: any) {
      if (error.message.includes('Forbidden')) return sendError(res, 403, error.message);
      next(error);
    }
  }
};
