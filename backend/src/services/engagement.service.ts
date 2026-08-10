import { prisma } from '../utils/prisma';
import { GoalType, GoalStatus, AttendanceStatus } from '@prisma/client';

export const engagementService = {
  
  // ==========================================
  // STREAK ENGINE
  // ==========================================
  
  async calculateStreak(studentId: string): Promise<{ current: number, longest: number }> {
    // A streak is broken by an ABSENT.
    // LATE counts as present. EXCUSED doesn't break it but doesn't add to it.
    
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { session: { date: 'desc' } }
    });

    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    // To calculate current streak, we count from newest to oldest until we hit ABSENT
    for (let i = 0; i < records.length; i++) {
      const status = records[i].status;
      if (status === 'PRESENT' || status === 'LATE') {
        current++;
      } else if (status === 'ABSENT') {
        break; // Streak broken
      }
      // if EXCUSED, do nothing (streak frozen)
    }

    // To calculate longest, we iterate from oldest to newest
    const recordsAsc = [...records].reverse();
    for (let i = 0; i < recordsAsc.length; i++) {
      const status = recordsAsc[i].status;
      if (status === 'PRESENT' || status === 'LATE') {
        tempStreak++;
        if (tempStreak > longest) longest = tempStreak;
      } else if (status === 'ABSENT') {
        tempStreak = 0;
      }
    }

    return { current, longest };
  },

  // ==========================================
  // GOALS & FEASIBILITY ENGINE
  // ==========================================
  
  async createGoal(data: { studentId: string; goalType: GoalType; targetPercentage: number; subjectId?: string; academicPeriodId?: string }) {
    // Ensure no duplicate active goals
    const existing = await prisma.attendanceGoal.findFirst({
      where: {
        studentId: data.studentId,
        goalType: data.goalType,
        subjectId: data.subjectId,
        status: 'ACTIVE'
      }
    });
    if (existing) throw new Error('You already have an active goal of this type.');

    return prisma.attendanceGoal.create({ data });
  },

  async calculateFeasibility(studentId: string, subjectId: string, targetPercentage: number) {
    // 1. Get current stats
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId, session: { teachingAssignment: { subjectId } } }
    });
    
    const totalConducted = records.length;
    const totalPresent = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const currentPercentage = totalConducted === 0 ? 0 : (totalPresent / totalConducted) * 100;

    // 2. We need a way to know how many classes are left.
    // For this prototype, let's assume a standard 40 classes per subject per semester.
    const EXPECTED_CLASSES_PER_SEMESTER = 40;
    const remainingClasses = Math.max(0, EXPECTED_CLASSES_PER_SEMESTER - totalConducted);

    // 3. Formula: (totalPresent + X) / (totalConducted + remainingClasses) >= targetPercentage / 100
    // X = required classes to attend
    const requiredTotal = Math.ceil((targetPercentage / 100) * (totalConducted + remainingClasses));
    const requiredRemaining = Math.max(0, requiredTotal - totalPresent);
    
    const maxPossible = totalConducted + remainingClasses === 0 ? 0 : ((totalPresent + remainingClasses) / (totalConducted + remainingClasses)) * 100;
    const isPossible = requiredRemaining <= remainingClasses;

    return {
      currentPercentage,
      targetPercentage,
      remainingClasses,
      requiredRemaining,
      maxPossible,
      isPossible,
      message: isPossible 
        ? `You must attend ${requiredRemaining} of the remaining ${remainingClasses} classes.` 
        : `This goal is mathematically impossible. Max possible is ${maxPossible.toFixed(1)}%.`
    };
  },

  async getMyGoals(studentId: string) {
    return prisma.attendanceGoal.findMany({
      where: { studentId },
      include: { subject: true }
    });
  },

  // ==========================================
  // ACHIEVEMENTS ENGINE
  // ==========================================

  async getMyAchievements(studentId: string) {
    return prisma.studentAchievement.findMany({
      where: { studentId },
      include: { achievement: true }
    });
  },

  async evaluateAchievements(studentId: string) {
    // Example: Evaluate if streak > 10
    const { current } = await this.calculateStreak(studentId);
    
    if (current >= 10) {
      const streak10 = await prisma.achievement.findUnique({ where: { criteriaKey: 'STREAK_10' } });
      if (streak10) {
        try {
          await prisma.studentAchievement.create({
            data: { studentId, achievementId: streak10.id }
          });
          // Update score
          await prisma.student.update({
            where: { id: studentId },
            data: { engagementScore: { increment: 50 } }
          });
        } catch (e) {
          // Ignore unique constraint violation (already earned)
        }
      }
    }
  },

  // Utility to seed achievements if they don't exist
  async seedAchievements() {
    const defaultAchievements = [
      { name: 'Consistency Master', description: 'Achieve a 10-class attendance streak.', criteriaKey: 'STREAK_10', icon: '🔥', rarity: 'RARE' },
      { name: 'Perfect Week', description: 'Attend all classes in a week.', criteriaKey: 'PERFECT_WEEK', icon: '⭐', rarity: 'COMMON' }
    ];

    for (const ach of defaultAchievements) {
      await prisma.achievement.upsert({
        where: { criteriaKey: ach.criteriaKey },
        update: {},
        create: ach
      });
    }
  }

};
