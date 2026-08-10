import { prisma } from '../utils/prisma';

export const studentService = {
  
  // 1. Get complete student academic profile
  async getStudentProfile(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true, status: true, role: true } },
        institute: { select: { code: true, name: true } },
        department: { select: { code: true, name: true } },
        currentSem: { select: { term: true, name: true } },
        academicYear: { select: { name: true } },
        class: { select: { name: true, division: true } }
      }
    });
    if (!student) throw new Error('Student profile not found');
    return student;
  },

  // 2. Update Student Profile (Safe fields only)
  async updateStudentProfile(userId: string, data: { name?: string }) {
    if (data.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: data.name }
      });
    }
    // Return updated profile
    return await this.getStudentProfile(userId);
  },

  // 3. Get Student Enrolled Subjects
  async getStudentSubjects(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student || !student.classId) {
      return []; // No class = no subjects
    }

    // Find all teaching assignments for the student's current class
    const assignments = await prisma.teachingAssignment.findMany({
      where: { classId: student.classId },
      include: {
        subject: true,
        faculty: { include: { user: { select: { name: true } } } }
      }
    });

    return assignments;
  },

  // 4. Get specific subject details (Object-Level Authorization)
  async getStudentSubjectDetails(userId: string, subjectId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student || !student.classId) throw new Error('No class assigned');

    // Object-level auth: Check if a TeachingAssignment exists linking the student's class to the requested subject
    const assignment = await prisma.teachingAssignment.findFirst({
      where: { classId: student.classId, subjectId },
      include: {
        subject: true,
        faculty: { include: { user: { select: { name: true, email: true } } } },
        class: { select: { name: true, division: true } }
      }
    });

    if (!assignment) {
      throw new Error('Forbidden: You are not enrolled in this subject');
    }

    return assignment;
  },

  // ---------------------------------------------------------
  // ADMIN FUNCTIONS
  // ---------------------------------------------------------
  
  // 5. Assign student to academic context (Class)
  async adminAssignAcademicContext(studentId: string, data: { classId: string; currentSemId: string; academicYearId: string }) {
    // We must validate that the requested class mathematically matches the student's department/semester/year
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error('Student not found');

    const targetClass = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!targetClass) throw new Error('Target class not found');

    if (targetClass.departmentId !== student.departmentId) {
      throw new Error('Invalid Assignment: Class department does not match student department.');
    }
    if (targetClass.semesterId !== data.currentSemId) {
      throw new Error('Invalid Assignment: Class semester does not match requested semester.');
    }
    if (targetClass.academicYearId !== data.academicYearId) {
      throw new Error('Invalid Assignment: Class academic year does not match requested academic year.');
    }

    // Update the student
    return await prisma.student.update({
      where: { id: studentId },
      data: {
        classId: data.classId,
        currentSemId: data.currentSemId,
        academicYearId: data.academicYearId
      },
      include: {
        class: { select: { name: true } },
        currentSem: { select: { name: true } }
      }
    });
  }
};
