import { prisma } from '../utils/prisma';

export const facultyService = {
  
  // 1. Get complete faculty profile
  async getFacultyProfile(userId: string) {
    const faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true, status: true, role: true } },
        institute: { select: { code: true, name: true } },
        department: { select: { code: true, name: true } }
      }
    });
    if (!faculty) throw new Error('Faculty profile not found');
    return faculty;
  },

  // 2. Update Faculty Profile (Safe fields only)
  async updateFacultyProfile(userId: string, data: { name?: string }) {
    if (data.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: data.name }
      });
    }
    return await this.getFacultyProfile(userId);
  },

  // 3. Get All Teaching Assignments for Faculty
  async getFacultyAssignments(userId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new Error('Faculty profile not found');

    return await prisma.teachingAssignment.findMany({
      where: { facultyId: faculty.id },
      include: {
        subject: true,
        class: true,
        academicYear: true,
        semester: true
      },
      orderBy: [
        { academicYear: { startDate: 'desc' } },
        { semester: { term: 'desc' } }
      ]
    });
  },

  // 4. Get specific assignment details (Object-Level Authorization built-in via facultyId)
  async getFacultyAssignmentDetails(userId: string, assignmentId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new Error('Faculty profile not found');

    const assignment = await prisma.teachingAssignment.findFirst({
      where: { id: assignmentId, facultyId: faculty.id },
      include: {
        subject: true,
        class: { include: { department: true } },
        academicYear: true,
        semester: true
      }
    });

    if (!assignment) {
      throw new Error('Forbidden: You are not authorized to view this assignment');
    }

    return assignment;
  },

  // 5. Get Distinct Subjects Faculty Teaches
  async getFacultySubjects(userId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) return [];

    // Find all assignments, then map to distinct subjects
    const assignments = await prisma.teachingAssignment.findMany({
      where: { facultyId: faculty.id },
      include: { subject: true, class: true }
    });

    const subjectMap = new Map();
    assignments.forEach(a => {
      if (!subjectMap.has(a.subjectId)) {
        subjectMap.set(a.subjectId, {
          ...a.subject,
          classesTaught: []
        });
      }
      subjectMap.get(a.subjectId).classesTaught.push(a.class.name);
    });

    return Array.from(subjectMap.values());
  },

  // 6. Get Distinct Classes Faculty Teaches
  async getFacultyClasses(userId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) return [];

    const assignments = await prisma.teachingAssignment.findMany({
      where: { facultyId: faculty.id },
      include: { 
        class: {
          include: { department: true, semester: true, academicYear: true }
        }, 
        subject: true 
      }
    });

    const classMap = new Map();
    assignments.forEach(a => {
      if (!classMap.has(a.classId)) {
        classMap.set(a.classId, {
          ...a.class,
          subjects: []
        });
      }
      classMap.get(a.classId).subjects.push({
        ...a.subject,
        assignmentId: a.id
      });
    });

    return Array.from(classMap.values());
  },

  // 7. Get Students in a Class (Object-Level Authorization checks assignment existence)
  async getClassStudents(userId: string, classId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new Error('Faculty profile not found');

    // Object-Level Auth: Check if faculty actually teaches this class
    const assignmentExists = await prisma.teachingAssignment.findFirst({
      where: { facultyId: faculty.id, classId: classId }
    });

    if (!assignmentExists) {
      throw new Error('Forbidden: You do not teach this class');
    }

    // Return the students
    return await prisma.student.findMany({
      where: { classId },
      include: {
        user: { select: { name: true, email: true, status: true } },
      },
      orderBy: { studentId: 'asc' } // Sort by roll number naturally
    });
  }
};
