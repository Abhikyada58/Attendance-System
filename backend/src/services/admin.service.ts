import { prisma } from '../utils/prisma';
import { auditService } from './audit.service';
import { AccountStatus } from '@prisma/client';

export const adminService = {
  
  async getDashboardStats() {
    const [totalStudents, totalFaculty, totalSubjects, activeSessions, todayRecords] = await Promise.all([
      prisma.student.count(),
      prisma.faculty.count(),
      prisma.subject.count(),
      prisma.attendanceSession.count({ where: { status: 'OPEN' } }),
      prisma.attendanceRecord.count({
        where: {
          markedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    return {
      totalStudents,
      totalFaculty,
      totalSubjects,
      activeSessions,
      todayRecords
    };
  },

  async getUsers(page: number = 1, limit: number = 20, search?: string, role?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async setUserStatus(adminUserId: string, targetUserId: string, status: AccountStatus) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new Error('User not found');

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status }
    });

    await auditService.logAction(adminUserId, `USER_${status}`, 'User', targetUserId, {
      previousStatus: user.status
    });

    return {
      id: updated.id,
      status: updated.status
    };
  }
};
