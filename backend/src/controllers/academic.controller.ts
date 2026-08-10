/**
 * Academic Controller
 * 
 * Validates inputs and routes requests to the Academic Service.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { academicService } from '../services/academic.service';
import { sendSuccess, sendError } from '../utils/response';
import { SubjectType } from '@prisma/client';

export const academicController = {
  // INSTITUTES
  async createInstitute(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().min(2), code: z.string().min(2) });
      const data = schema.parse(req.body);
      const result = await academicService.createInstitute(data);
      return sendSuccess(res, 201, result, 'Institute created successfully.');
    } catch (error) { next(error); }
  },

  async getInstitutes(req: Request, res: Response, next: NextFunction) {
    try {
      const activeOnly = req.query.active === 'true';
      const result = await academicService.getInstitutes(activeOnly);
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  async updateInstitute(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().optional(), code: z.string().optional(), isActive: z.boolean().optional() });
      const data = schema.parse(req.body);
      const result = await academicService.updateInstitute(req.params.id, data);
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  // DEPARTMENTS
  async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string(), code: z.string(), instituteId: z.string().uuid() });
      const data = schema.parse(req.body);
      const result = await academicService.createDepartment(data);
      return sendSuccess(res, 201, result);
    } catch (error) { next(error); }
  },

  async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await academicService.getDepartments({ 
        instituteId: req.query.instituteId as string,
        activeOnly: req.query.active === 'true'
      });
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().optional(), code: z.string().optional(), isActive: z.boolean().optional() });
      const data = schema.parse(req.body);
      const result = await academicService.updateDepartment(req.params.id, data);
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  // ACADEMIC YEARS
  async createAcademicYear(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string(), startDate: z.string(), endDate: z.string(), isActive: z.boolean().optional() });
      const { startDate, endDate, ...rest } = schema.parse(req.body);
      const result = await academicService.createAcademicYear({ ...rest, startDate: new Date(startDate), endDate: new Date(endDate) });
      return sendSuccess(res, 201, result);
    } catch (error) { next(error); }
  },

  async getAcademicYears(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await academicService.getAcademicYears();
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  async updateAcademicYear(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().optional(), startDate: z.string().optional(), endDate: z.string().optional(), isActive: z.boolean().optional() });
      const { startDate, endDate, ...rest } = schema.parse(req.body);
      const data: any = { ...rest };
      if (startDate) data.startDate = new Date(startDate);
      if (endDate) data.endDate = new Date(endDate);

      const result = await academicService.updateAcademicYear(req.params.id, data);
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  // SEMESTERS
  async createSemester(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ term: z.number().int().min(1), name: z.string() });
      const data = schema.parse(req.body);
      const result = await academicService.createSemester(data);
      return sendSuccess(res, 201, result);
    } catch (error) { next(error); }
  },

  async getSemesters(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await academicService.getSemesters();
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  async updateSemester(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().optional(), term: z.number().optional(), isActive: z.boolean().optional() });
      const data = schema.parse(req.body);
      const result = await academicService.updateSemester(req.params.id, data);
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  // CLASSES
  async createClass(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        name: z.string(), division: z.string().optional(),
        departmentId: z.string().uuid(), semesterId: z.string().uuid(),
        academicYearId: z.string().uuid(), instituteId: z.string().uuid()
      });
      const data = schema.parse(req.body);
      const result = await academicService.createClass(data);
      return sendSuccess(res, 201, result);
    } catch (error) { next(error); }
  },

  async getClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await academicService.getClasses({
        departmentId: req.query.departmentId as string,
        academicYearId: req.query.academicYearId as string,
        semesterId: req.query.semesterId as string
      });
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  async updateClass(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ name: z.string().optional(), division: z.string().optional(), isActive: z.boolean().optional() });
      const data = schema.parse(req.body);
      const result = await academicService.updateClass(req.params.id, data);
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  // SUBJECTS
  async createSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        code: z.string(), name: z.string(), credits: z.number().optional(),
        type: z.nativeEnum(SubjectType).optional(),
        departmentId: z.string().uuid(), semesterId: z.string().uuid()
      });
      const data = schema.parse(req.body);
      const result = await academicService.createSubject(data);
      return sendSuccess(res, 201, result);
    } catch (error) { next(error); }
  },

  async getSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await academicService.getSubjects({
        departmentId: req.query.departmentId as string,
        semesterId: req.query.semesterId as string
      });
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  async updateSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        name: z.string().optional(), code: z.string().optional(),
        credits: z.number().optional(), type: z.nativeEnum(SubjectType).optional(),
        isActive: z.boolean().optional()
      });
      const data = schema.parse(req.body);
      const result = await academicService.updateSubject(req.params.id, data);
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  },

  // TEACHING ASSIGNMENTS
  async createTeachingAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        facultyId: z.string().uuid(), subjectId: z.string().uuid(),
        classId: z.string().uuid(), academicYearId: z.string().uuid(),
        semesterId: z.string().uuid()
      });
      const data = schema.parse(req.body);
      const result = await academicService.createTeachingAssignment(data);
      return sendSuccess(res, 201, result);
    } catch (error) { next(error); }
  },

  async getTeachingAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await academicService.getTeachingAssignments({
        facultyId: req.query.facultyId as string,
        classId: req.query.classId as string
      });
      return sendSuccess(res, 200, result);
    } catch (error) { next(error); }
  }
};
