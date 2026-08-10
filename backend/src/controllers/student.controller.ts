import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { studentService } from '../services/student.service';
import { sendSuccess, sendError } from '../utils/response';

export const studentController = {
  // GET /me
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const profile = await studentService.getStudentProfile(userId);
      return sendSuccess(res, 200, profile);
    } catch (error) { next(error); }
  },

  // PATCH /me
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      // Zod explicitly strips out any attempt to update academic/authoritative fields
      const schema = z.object({ name: z.string().min(2).optional() });
      const data = schema.parse(req.body);
      
      const result = await studentService.updateStudentProfile(userId, data);
      return sendSuccess(res, 200, result, 'Profile updated successfully');
    } catch (error) { next(error); }
  },

  // GET /me/subjects
  async getSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const subjects = await studentService.getStudentSubjects(userId);
      return sendSuccess(res, 200, subjects);
    } catch (error) { next(error); }
  },

  // GET /me/subjects/:subjectId
  async getSubjectDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const subjectId = z.string().uuid().parse(req.params.subjectId);
      
      const details = await studentService.getStudentSubjectDetails(userId, subjectId);
      return sendSuccess(res, 200, details);
    } catch (error: any) { 
      if (error.message.includes('Forbidden')) {
        return sendError(res, 403, error.message);
      }
      next(error); 
    }
  },

  // PATCH /admin/students/:id/academic
  async adminAssignAcademic(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = z.string().uuid().parse(req.params.id);
      const schema = z.object({
        classId: z.string().uuid(),
        currentSemId: z.string().uuid(),
        academicYearId: z.string().uuid()
      });
      const data = schema.parse(req.body);

      const result = await studentService.adminAssignAcademicContext(studentId, data);
      return sendSuccess(res, 200, result, 'Student assigned successfully');
    } catch (error) { next(error); }
  }
};
