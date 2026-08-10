import { prisma } from '../utils/prisma';
import { addDays, startOfDay, endOfDay, setHours, setMinutes, isBefore, isAfter, isSameDay } from 'date-fns';
import { ScheduledClassStatus, CalendarEventType } from '@prisma/client';

export const scheduleService = {
  
  /**
   * Generates ScheduledClass records for a given date range.
   * This function is idempotent and skips holidays.
   * 
   * @param startDate Date to start generation from (defaults to today)
   * @param daysToGenerate Horizon of days to look ahead (defaults to 30)
   */
  async generateScheduledClasses(startDate: Date = new Date(), daysToGenerate: number = 30) {
    const start = startOfDay(startDate);
    const end = endOfDay(addDays(start, daysToGenerate));
    
    // 1. Fetch active timetables
    const activeTimetables = await prisma.timetable.findMany({
      where: {
        isActive: true,
        effectiveFrom: { lte: end },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: start } }
        ]
      },
      include: {
        teachingAssignment: true
      }
    });

    // 2. Fetch academic calendar events for this range
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        date: { gte: start, lte: end }
      }
    });

    let generatedCount = 0;

    // 3. Iterate through each day in the horizon
    for (let i = 0; i < daysToGenerate; i++) {
      const currentDate = addDays(start, i);
      const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      
      // Check calendar event for this day
      const eventForDay = calendarEvents.find(e => isSameDay(e.date, currentDate));
      
      // If there's an event and it's NOT a working day, we skip generating timetable classes
      // (Unless a special class overrides it, but the base generator respects holidays)
      if (eventForDay && !eventForDay.isWorkingDay) {
        continue;
      }

      // If it's a weekend (Sunday 0) and no special working day event exists, standard behavior is usually to skip.
      // However, we rely on the timetable itself: if a timetable slot exists for dayOfWeek=0, they intend to teach on Sunday.
      // So we just match by dayOfWeek.

      const timetablesForDay = activeTimetables.filter(t => 
        t.dayOfWeek === dayOfWeek &&
        isBefore(t.effectiveFrom, endOfDay(currentDate)) &&
        (!t.effectiveTo || isAfter(t.effectiveTo, startOfDay(currentDate)))
      );

      for (const timetable of timetablesForDay) {
        // Parse "HH:mm"
        const [startHour, startMin] = timetable.startTime.split(':').map(Number);
        const [endHour, endMin] = timetable.endTime.split(':').map(Number);
        
        const classStartTime = setMinutes(setHours(currentDate, startHour), startMin);
        const classEndTime = setMinutes(setHours(currentDate, endHour), endMin);

        // Idempotency: Check if ScheduledClass already exists
        const existingClass = await prisma.scheduledClass.findUnique({
          where: {
            timetableId_date: {
              timetableId: timetable.id,
              date: startOfDay(currentDate)
            }
          }
        });

        if (!existingClass) {
          await prisma.scheduledClass.create({
            data: {
              timetableId: timetable.id,
              date: startOfDay(currentDate),
              startTime: classStartTime,
              endTime: classEndTime,
              status: ScheduledClassStatus.SCHEDULED
            }
          });
          generatedCount++;
        }
      }
    }

    return { generatedCount, message: `Successfully generated ${generatedCount} scheduled classes.` };
  },

  /**
   * Links a manually started attendance session to a scheduled class
   */
  async linkAttendanceSession(sessionId: string, scheduledClassId: string) {
    const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
    const scheduledClass = await prisma.scheduledClass.findUnique({ 
      where: { id: scheduledClassId },
      include: { timetable: true } 
    });

    if (!session || !scheduledClass) throw new Error('Session or Scheduled Class not found.');

    if (session.teachingAssignmentId !== scheduledClass.timetable.teachingAssignmentId) {
       throw new Error('Cannot link session to a schedule of a different teaching assignment.');
    }

    // Link them
    await prisma.scheduledClass.update({
      where: { id: scheduledClass.id },
      data: {
        status: ScheduledClassStatus.COMPLETED
      }
    });

    return prisma.attendanceSession.update({
      where: { id: session.id },
      data: { scheduledClassId: scheduledClass.id }
    });
  }
};
