import { prisma } from '../utils/prisma';

export const timetableService = {
  async getTimetables(filters: { classId?: string; facultyId?: string; isActive?: boolean }) {
    return prisma.timetable.findMany({
      where: {
        ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
        teachingAssignment: {
          ...(filters.classId ? { classId: filters.classId } : {}),
          ...(filters.facultyId ? { facultyId: filters.facultyId } : {}),
        }
      },
      include: {
        teachingAssignment: {
          include: {
            subject: true,
            faculty: { include: { user: true } },
            class: true,
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
  },

  async createTimetable(data: {
    teachingAssignmentId: string;
    dayOfWeek: number;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    roomId?: string;
    effectiveFrom: Date;
    effectiveTo?: Date;
  }) {
    // Validate time logic
    if (data.startTime >= data.endTime) {
      throw new Error('Start time must be before end time.');
    }

    // Retrieve teaching assignment to check for conflicts
    const assignment = await prisma.teachingAssignment.findUnique({
      where: { id: data.teachingAssignmentId },
      include: { faculty: true, class: true }
    });

    if (!assignment) {
      throw new Error('Teaching assignment not found.');
    }

    // Detect conflicts (overlapping time on same day for same faculty OR same class)
    const existingSchedules = await prisma.timetable.findMany({
      where: {
        dayOfWeek: data.dayOfWeek,
        isActive: true,
        OR: [
          { teachingAssignment: { facultyId: assignment.facultyId } },
          { teachingAssignment: { classId: assignment.classId } }
        ]
      },
      include: { teachingAssignment: { include: { faculty: { include: { user: true } }, class: true } } }
    });

    for (const schedule of existingSchedules) {
      // Check time overlap
      if (
        (data.startTime >= schedule.startTime && data.startTime < schedule.endTime) ||
        (data.endTime > schedule.startTime && data.endTime <= schedule.endTime) ||
        (data.startTime <= schedule.startTime && data.endTime >= schedule.endTime)
      ) {
        if (schedule.teachingAssignment.facultyId === assignment.facultyId) {
          throw new Error(`Conflict: Faculty ${schedule.teachingAssignment.faculty.user.name} is already scheduled during this time.`);
        }
        if (schedule.teachingAssignment.classId === assignment.classId) {
          throw new Error(`Conflict: Class ${schedule.teachingAssignment.class.name} already has a scheduled class during this time.`);
        }
      }
    }

    // Prevent duplicate exact timetable
    const duplicate = await prisma.timetable.findFirst({
      where: {
        teachingAssignmentId: data.teachingAssignmentId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: true
      }
    });

    if (duplicate) {
      throw new Error('This exact timetable slot already exists.');
    }

    return prisma.timetable.create({
      data: {
        ...data,
        isActive: true
      }
    });
  },

  async updateTimetable(id: string, data: Partial<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomId: string;
    effectiveFrom: Date;
    effectiveTo: Date;
    isActive: boolean;
  }>) {
    return prisma.timetable.update({
      where: { id },
      data,
    });
  },

  async deleteTimetable(id: string) {
    // Instead of hard delete, deactivate to preserve history
    return prisma.timetable.update({
      where: { id },
      data: { isActive: false }
    });
  }
};
