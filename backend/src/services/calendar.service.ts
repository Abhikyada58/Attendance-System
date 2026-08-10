import { prisma } from '../utils/prisma';
import { CalendarEventType } from '@prisma/client';

export const calendarService = {
  async getEvents(academicYearId: string, startDate?: Date, endDate?: Date) {
    return prisma.calendarEvent.findMany({
      where: {
        academicYearId,
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  },

  async createEvent(data: {
    academicYearId: string;
    date: Date;
    type: CalendarEventType;
    title: string;
    description?: string;
    isWorkingDay: boolean;
  }) {
    // Check if event already exists for this date
    const existing = await prisma.calendarEvent.findUnique({
      where: {
        academicYearId_date: {
          academicYearId: data.academicYearId,
          date: data.date,
        }
      }
    });

    if (existing) {
      throw new Error('An event already exists for this date in the specified academic year.');
    }

    return prisma.calendarEvent.create({
      data,
    });
  },

  async updateEvent(id: string, data: Partial<{
    type: CalendarEventType;
    title: string;
    description: string;
    isWorkingDay: boolean;
  }>) {
    return prisma.calendarEvent.update({
      where: { id },
      data,
    });
  },

  async deleteEvent(id: string) {
    return prisma.calendarEvent.delete({
      where: { id },
    });
  }
};
