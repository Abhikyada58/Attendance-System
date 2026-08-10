import { prisma } from '../utils/prisma';
import { ScheduledClassStatus } from '@prisma/client';

export const planningService = {
  
  /**
   * Calculates the attendance planning metrics for a student in a specific teaching assignment.
   */
  async getStudentPlanningMetrics(studentId: string, teachingAssignmentId: string, targetPercentage: number = 75) {
    // 1. Get past attendance records for this assignment
    const pastRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId,
        session: { teachingAssignmentId }
      },
      include: { session: true }
    });

    const totalConducted = pastRecords.length;
    const totalPresent = pastRecords.filter(r => r.status === 'PRESENT').length;
    const currentPercentage = totalConducted === 0 ? 100 : (totalPresent / totalConducted) * 100;

    // 2. Get future scheduled classes for this assignment
    const upcomingScheduled = await prisma.scheduledClass.findMany({
      where: {
        timetable: { teachingAssignmentId },
        date: { gte: new Date() },
        status: ScheduledClassStatus.SCHEDULED
      }
    });

    const remainingClasses = upcomingScheduled.length;
    
    // 3. Mathematical Calculations
    const maxPossibleTotal = totalConducted + remainingClasses;
    const maxPossiblePercentage = maxPossibleTotal === 0 ? 100 : ((totalPresent + remainingClasses) / maxPossibleTotal) * 100;
    const minPossiblePercentage = maxPossibleTotal === 0 ? 100 : (totalPresent / maxPossibleTotal) * 100;

    // Required classes to hit target
    // target = (present + required) / (conducted + remaining)
    // required = (target * (conducted + remaining)) - present
    const requiredToHitTarget = Math.ceil((targetPercentage / 100) * maxPossibleTotal) - totalPresent;
    
    let isReachable = true;
    let requiredClasses = Math.max(0, requiredToHitTarget);

    if (requiredClasses > remainingClasses) {
      isReachable = false;
      requiredClasses = remainingClasses; // Or keep as what they need, even if impossible
    }

    return {
      currentPercentage: Math.round(currentPercentage),
      totalConducted,
      totalPresent,
      targetPercentage,
      remainingClasses,
      requiredClasses,
      maxPossiblePercentage: Math.round(maxPossiblePercentage),
      minPossiblePercentage: Math.round(minPossiblePercentage),
      isReachable
    };
  }
};
