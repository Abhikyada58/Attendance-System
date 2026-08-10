import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reportService } from '../services/report.service';
import { analyticsService } from '../services/analytics.service';
import { sendError } from '../utils/response';

export const reportController = {
  
  async exportStudentReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      const schema = z.object({
        format: z.enum(['csv', 'excel', 'pdf']),
        startDate: z.string().optional(),
        endDate: z.string().optional()
      });
      const { format, startDate, endDate } = schema.parse(req.query);

      // In real scenario, Admin could pass a studentId in query. We'll default to self if Student.
      let targetUserId = user.userId;
      if (user.role === 'ADMIN' && req.query.targetUserId) {
        targetUserId = req.query.targetUserId as string;
      } else if (user.role === 'FACULTY') {
        return sendError(res, 403, 'Faculty cannot generate full student multi-subject reports');
      }

      // Fetch Subject analytics (which now supports date filters)
      const data = await analyticsService.getStudentSubjects(targetUserId, startDate, endDate);
      
      if (!data || data.length === 0) {
        return sendError(res, 404, 'No attendance data found for the selected filters.');
      }

      const reportData = {
        title: 'Student Attendance Report',
        filters: {
          'Date Range': (startDate && endDate) ? `${startDate} to ${endDate}` : 'All Time'
        },
        summary: {
          'Total Subjects': data.length,
          'Overall Average': (data.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / data.length).toFixed(2) + '%'
        },
        columns: [
          { header: 'Subject Code', key: 'code', width: 20 },
          { header: 'Subject Name', key: 'name', width: 40 },
          { header: 'Total Sessions', key: 'totalSessions', width: 15 },
          { header: 'Present', key: 'present', width: 10 },
          { header: 'Absent', key: 'absent', width: 10 },
          { header: 'Attendance %', key: 'attendancePercentage', width: 15 },
          { header: 'Status', key: 'status', width: 15 }
        ],
        rows: data.map(d => ({
          code: d.code,
          name: d.name,
          totalSessions: d.totalSessions,
          present: d.present,
          absent: d.absent,
          attendancePercentage: `${d.attendancePercentage}%`,
          status: d.status
        }))
      };

      if (format === 'csv') return reportService.renderCSV(reportData, res);
      if (format === 'excel') return reportService.renderExcel(reportData, res);
      if (format === 'pdf') return reportService.renderPDF(reportData, res);
      
    } catch (error) {
      next(error);
    }
  },

  async exportFacultyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      const schema = z.object({
        format: z.enum(['csv', 'excel', 'pdf']),
      });
      const { format } = schema.parse(req.query);

      let targetUserId = user.userId;
      if (user.role === 'ADMIN' && req.query.targetUserId) {
        targetUserId = req.query.targetUserId as string;
      } else if (user.role === 'STUDENT') {
        return sendError(res, 403, 'Students cannot generate faculty reports');
      }

      const data = await analyticsService.getFacultyClasses(targetUserId);

      if (!data || data.length === 0) {
        return sendError(res, 404, 'No teaching data found.');
      }

      const reportData = {
        title: 'Faculty Class Attendance Report',
        filters: {
          'View': 'All Assigned Classes'
        },
        summary: {
          'Total Classes': data.length,
        },
        columns: [
          { header: 'Class Name', key: 'className', width: 25 },
          { header: 'Subject Name', key: 'subjectName', width: 40 },
          { header: 'Total Students', key: 'totalStudents', width: 15 },
          { header: 'Sessions', key: 'totalSessions', width: 10 },
          { header: 'Average Att %', key: 'averageAttendance', width: 15 },
          { header: 'Below Threshold', key: 'studentsBelowThreshold', width: 15 }
        ],
        rows: data.map(d => ({
          className: d.className,
          subjectName: d.subjectName,
          totalStudents: d.totalStudents,
          totalSessions: d.totalSessions,
          averageAttendance: `${d.averageAttendance}%`,
          studentsBelowThreshold: d.studentsBelowThreshold
        }))
      };

      if (format === 'csv') return reportService.renderCSV(reportData, res);
      if (format === 'excel') return reportService.renderExcel(reportData, res);
      if (format === 'pdf') return reportService.renderPDF(reportData, res);

    } catch (error) {
      next(error);
    }
  }
};
