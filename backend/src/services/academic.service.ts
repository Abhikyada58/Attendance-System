/**
 * Academic Service
 * 
 * Handles the business logic for managing the academic hierarchy.
 * Ensures data integrity (e.g., department must belong to institute).
 */

import { prisma } from '../utils/prisma';

export const academicService = {
  
  // ---------------------------------------------------------
  // INSTITUTE MANAGEMENT
  // ---------------------------------------------------------
  async createInstitute(data: { name: string; code: string }) {
    return await prisma.institute.create({ data });
  },

  async getInstitutes(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return await prisma.institute.findMany({ where, orderBy: { name: 'asc' } });
  },

  async updateInstitute(id: string, data: { name?: string; code?: string; isActive?: boolean }) {
    return await prisma.institute.update({ where: { id }, data });
  },

  // ---------------------------------------------------------
  // DEPARTMENT MANAGEMENT
  // ---------------------------------------------------------
  async createDepartment(data: { name: string; code: string; instituteId: string }) {
    // Ensure institute exists
    const inst = await prisma.institute.findUnique({ where: { id: data.instituteId } });
    if (!inst) throw new Error('Institute not found');
    
    return await prisma.department.create({ data });
  },

  async getDepartments(filters?: { instituteId?: string; activeOnly?: boolean }) {
    const where: any = {};
    if (filters?.instituteId) where.instituteId = filters.instituteId;
    if (filters?.activeOnly) where.isActive = true;

    return await prisma.department.findMany({ 
      where, 
      include: { institute: { select: { name: true, code: true } } },
      orderBy: { name: 'asc' } 
    });
  },

  async updateDepartment(id: string, data: { name?: string; code?: string; isActive?: boolean }) {
    return await prisma.department.update({ where: { id }, data });
  },

  // ---------------------------------------------------------
  // ACADEMIC YEAR MANAGEMENT
  // ---------------------------------------------------------
  async createAcademicYear(data: { name: string; startDate: Date; endDate: Date; isActive?: boolean }) {
    if (data.isActive) {
      // If marking as active, optionally deactivate others if business rule demands only one active year
      await prisma.academicYear.updateMany({ data: { isActive: false } });
    }
    return await prisma.academicYear.create({ data });
  },

  async getAcademicYears() {
    return await prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } });
  },

  async updateAcademicYear(id: string, data: { name?: string; startDate?: Date; endDate?: Date; isActive?: boolean }) {
    if (data.isActive) {
      await prisma.academicYear.updateMany({ where: { id: { not: id } }, data: { isActive: false } });
    }
    return await prisma.academicYear.update({ where: { id }, data });
  },

  // ---------------------------------------------------------
  // SEMESTER MANAGEMENT
  // ---------------------------------------------------------
  async createSemester(data: { term: number; name: string }) {
    return await prisma.semester.create({ data });
  },

  async getSemesters() {
    return await prisma.semester.findMany({ orderBy: { term: 'asc' } });
  },

  async updateSemester(id: string, data: { name?: string; term?: number; isActive?: boolean }) {
    return await prisma.semester.update({ where: { id }, data });
  },

  // ---------------------------------------------------------
  // CLASS (COHORT) MANAGEMENT
  // ---------------------------------------------------------
  async createClass(data: { name: string; division?: string; departmentId: string; semesterId: string; academicYearId: string; instituteId: string }) {
    // Verify relationships
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept || dept.instituteId !== data.instituteId) {
      throw new Error('Invalid Department or Institute mapping.');
    }

    return await prisma.class.create({ data });
  },

  async getClasses(filters?: { departmentId?: string; academicYearId?: string; semesterId?: string }) {
    return await prisma.class.findMany({
      where: filters || {},
      include: {
        department: { select: { name: true, code: true } },
        semester: { select: { name: true, term: true } },
        academicYear: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
  },

  async updateClass(id: string, data: { name?: string; division?: string; isActive?: boolean }) {
    return await prisma.class.update({ where: { id }, data });
  },

  // ---------------------------------------------------------
  // SUBJECT MANAGEMENT
  // ---------------------------------------------------------
  async createSubject(data: { code: string; name: string; credits?: number; type?: any; departmentId: string; semesterId: string }) {
    return await prisma.subject.create({ data });
  },

  async getSubjects(filters?: { departmentId?: string; semesterId?: string }) {
    return await prisma.subject.findMany({
      where: filters || {},
      include: {
        department: { select: { name: true, code: true } },
        semester: { select: { name: true, term: true } }
      },
      orderBy: { code: 'asc' }
    });
  },

  async updateSubject(id: string, data: { name?: string; code?: string; credits?: number; type?: any; isActive?: boolean }) {
    return await prisma.subject.update({ where: { id }, data });
  },

  // ---------------------------------------------------------
  // TEACHING ASSIGNMENTS
  // ---------------------------------------------------------
  async createTeachingAssignment(data: { facultyId: string; subjectId: string; classId: string; academicYearId: string; semesterId: string }) {
    return await prisma.teachingAssignment.create({
      data,
      include: {
        faculty: { include: { user: { select: { name: true } } } },
        subject: { select: { name: true, code: true } },
        class: { select: { name: true, division: true } }
      }
    });
  },

  async getTeachingAssignments(filters?: { facultyId?: string; classId?: string }) {
    return await prisma.teachingAssignment.findMany({
      where: filters || {},
      include: {
        faculty: { include: { user: { select: { name: true, email: true } } } },
        subject: { select: { name: true, code: true } },
        class: { select: { name: true, division: true } },
        academicYear: { select: { name: true } },
        semester: { select: { name: true, term: true } }
      }
    });
  }
};
