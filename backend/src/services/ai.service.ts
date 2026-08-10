import { prisma } from '../utils/prisma';
import { ATTENDANCE_RULES, calculatePercentage } from '../constants/attendance.rules';
import { AttendanceStatus } from '@prisma/client';
import { configurationService } from './configuration.service';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INSUFFICIENT_DATA';
export type TrendStatus = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'UNKNOWN';

export const aiService = {
  /**
   * Deterministic AI Baseline for predicting student risk.
   * Explains how many classes are required to secure a safe threshold,
   * and what happens if the next class is missed.
   */
  async getStudentPredictiveInsights(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new Error('Student not found');

    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        session: { status: ATTENDANCE_RULES.OFFICIAL_SESSION_STATUS as any }
      },
      include: {
        session: {
          include: {
            teachingAssignment: {
              include: { subject: true }
            }
          }
        }
      },
      orderBy: { session: { date: 'asc' } }
    });

    const subjectMap = new Map();

    records.forEach(r => {
      const subject = r.session.teachingAssignment.subject;
      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          subjectName: subject.name,
          subjectCode: subject.code,
          history: [], // Keep track of past attendance
        });
      }
      
      const stats = subjectMap.get(subject.id);
      const isAttended = r.status === AttendanceStatus.PRESENT || (ATTENDANCE_RULES.LATE_COUNTS_AS_ATTENDED && r.status === AttendanceStatus.LATE);
      stats.history.push(isAttended);
    });

    const warningThreshold = await configurationService.getSetting('WARNING_THRESHOLD', 75);
    const criticalThreshold = await configurationService.getSetting('CRITICAL_THRESHOLD', 60);
    const targetPct = warningThreshold; // Typically 75%
    const insights: any[] = [];

    subjectMap.forEach((stats) => {
      const totalSessions = stats.history.length;
      
      // MINIMUM DATA REQUIREMENT
      if (totalSessions < 3) {
        insights.push({
          subjectName: stats.subjectName,
          subjectCode: stats.subjectCode,
          riskLevel: 'INSUFFICIENT_DATA',
          confidence: 0,
          currentAttendance: calculatePercentage(stats.history.filter(Boolean).length, totalSessions),
          recommendation: "More attendance data is required before AI can generate accurate insights.",
          trend: 'UNKNOWN',
          missNextImpact: 0,
          classesRequiredToTarget: 0,
        });
        return;
      }

      const presentCount = stats.history.filter(Boolean).length;
      const currentAttendance = calculatePercentage(presentCount, totalSessions);

      // MISSED-CLASS IMPACT
      const missNextImpact = calculatePercentage(presentCount, totalSessions + 1);
      
      // CLASSES REQUIRED TO REACH TARGET (Algebraic deterministic projection)
      // (presentCount + X) / (totalSessions + X) >= (targetPct / 100)
      let classesRequiredToTarget = 0;
      if (currentAttendance < targetPct) {
        const requiredRatio = targetPct / 100;
        // presentCount + X = requiredRatio * totalSessions + requiredRatio * X
        // X * (1 - requiredRatio) = requiredRatio * totalSessions - presentCount
        const x = (requiredRatio * totalSessions - presentCount) / (1 - requiredRatio);
        classesRequiredToTarget = Math.max(0, Math.ceil(x));
      }

      // TREND CALCULATION (Last 3 classes)
      const lastThree = stats.history.slice(-3);
      let trend: TrendStatus = 'STABLE';
      if (lastThree.every((x: boolean) => x === true)) trend = 'IMPROVING';
      else if (lastThree.every((x: boolean) => x === false)) trend = 'DECLINING';

      // RISK CLASSIFICATION
      let riskLevel: RiskLevel = 'LOW';
      if (currentAttendance < criticalThreshold) {
        riskLevel = 'CRITICAL';
      } else if (currentAttendance < targetPct) {
        riskLevel = 'HIGH';
      } else if (missNextImpact < targetPct) {
        riskLevel = 'MEDIUM'; // Currently fine, but missing next class breaks the threshold
      }

      // RECOMMENDATION GENERATION
      let recommendation = "";
      if (riskLevel === 'CRITICAL') {
        recommendation = `Immediate action required. You must attend the next ${classesRequiredToTarget} consecutive sessions to avoid severe academic penalties.`;
      } else if (riskLevel === 'HIGH') {
        recommendation = `Your attendance is below the ${targetPct}% threshold. Prioritize attending the next ${classesRequiredToTarget} sessions.`;
      } else if (riskLevel === 'MEDIUM') {
        recommendation = `You are slightly above the threshold. If you miss the next class, you will drop to ${missNextImpact}%. Please attend.`;
      } else {
        recommendation = `Your attendance is secure. Keep up the consistent participation!`;
      }

      insights.push({
        subjectName: stats.subjectName,
        subjectCode: stats.subjectCode,
        riskLevel,
        confidence: 0.95, // Deterministic math model carries high confidence
        currentAttendance,
        targetAttendance: targetPct,
        missNextImpact,
        classesRequiredToTarget,
        trend,
        recommendation,
        predictionTimestamp: new Date().toISOString(),
        modelVersion: 'v1-deterministic'
      });
    });

    return insights;
  },

  /**
   * Faculty Aggregation: Provide a summary of high-risk students in assigned classes.
   */
  async getFacultyPredictiveInsights(userId: string) {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new Error('Faculty not found');

    const assignments = await prisma.teachingAssignment.findMany({
      where: { facultyId: faculty.id },
      include: {
        subject: true,
        class: { include: { students: { include: { user: true } } } },
        attendanceSessions: {
          where: { status: ATTENDANCE_RULES.OFFICIAL_SESSION_STATUS as any },
          include: { records: true }
        }
      }
    });

    const warningThreshold = await configurationService.getSetting('WARNING_THRESHOLD', 75);
    const criticalThreshold = await configurationService.getSetting('CRITICAL_THRESHOLD', 60);

    let highRiskCount = 0;
    let criticalRiskCount = 0;
    let insufficientDataCount = 0;
    const riskyStudents: any[] = [];

    assignments.forEach(assignment => {
      const studentMap = new Map();
      
      // Calculate attendance for each student in this subject
      assignment.attendanceSessions.forEach(session => {
        session.records.forEach(r => {
          if (!studentMap.has(r.studentId)) {
            studentMap.set(r.studentId, { present: 0, total: 0 });
          }
          const s = studentMap.get(r.studentId);
          s.total++;
          if (r.status === AttendanceStatus.PRESENT || (ATTENDANCE_RULES.LATE_COUNTS_AS_ATTENDED && r.status === AttendanceStatus.LATE)) {
            s.present++;
          }
        });
      });

      // Find risky students
      assignment.class.students.forEach(student => {
        const stats = studentMap.get(student.id);
        if (!stats) {
           insufficientDataCount++;
           return;
        }

        if (stats.total < 3) {
          insufficientDataCount++;
          return;
        }

        const pct = calculatePercentage(stats.present, stats.total);
        if (pct < criticalThreshold) {
          criticalRiskCount++;
          riskyStudents.push({ name: student.user.name, subject: assignment.subject.name, pct, risk: 'CRITICAL' });
        } else if (pct < warningThreshold) {
          highRiskCount++;
          riskyStudents.push({ name: student.user.name, subject: assignment.subject.name, pct, risk: 'HIGH' });
        }
      });
    });

    return {
      highRiskCount,
      criticalRiskCount,
      insufficientDataCount,
      riskyStudents: riskyStudents.sort((a, b) => a.pct - b.pct).slice(0, 10), // Top 10 most critical
      recommendation: criticalRiskCount > 0 
        ? `You have ${criticalRiskCount} students in the critical danger zone. Intervention is highly recommended.`
        : `Overall class health is stable. Monitor the ${highRiskCount} high-risk students.`
    };
  },

  /**
   * Admin Aggregation: System wide macro-trends
   */
  async getAdminPredictiveInsights() {
    const totalRecords = await prisma.attendanceRecord.count();
    const presentRecords = await prisma.attendanceRecord.count({
      where: {
        OR: [
          { status: AttendanceStatus.PRESENT },
          { status: AttendanceStatus.LATE } // Assuming late counts as present for baseline
        ]
      }
    });

    const systemAverage = totalRecords > 0 ? calculatePercentage(presentRecords, totalRecords) : 0;
    
    let systemRiskLevel: RiskLevel = 'LOW';
    const warningThreshold = await configurationService.getSetting('WARNING_THRESHOLD', 75);
    const criticalThreshold = await configurationService.getSetting('CRITICAL_THRESHOLD', 60);
    
    if (systemAverage < criticalThreshold) systemRiskLevel = 'CRITICAL';
    else if (systemAverage < warningThreshold) systemRiskLevel = 'HIGH';
    else if (systemAverage < 80) systemRiskLevel = 'MEDIUM';

    return {
      systemAverage,
      systemRiskLevel,
      trendRecommendation: systemRiskLevel === 'LOW' 
        ? 'The institute attendance average is healthy.' 
        : 'The institute attendance average is below acceptable thresholds. Departmental audits are recommended.',
      dataPointsAnalyzed: totalRecords,
      predictionTimestamp: new Date().toISOString()
    };
  }
};
