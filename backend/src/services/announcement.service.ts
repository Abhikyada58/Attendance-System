import { prisma } from '../utils/prisma';
import { AudienceType, AnnouncementStatus, NotificationPriority, NotificationType } from '@prisma/client';
import { notificationService } from './notification.service';

export const announcementService = {
  
  async createAnnouncement(data: {
    title: string;
    content: string;
    priority: NotificationPriority;
    targetAudience: AudienceType;
    targetId?: string;
    status: AnnouncementStatus;
    publishAt?: Date;
    expiresAt?: Date;
    createdBy: string;
  }) {
    return prisma.announcement.create({ data });
  },

  async updateAnnouncement(id: string, data: Partial<any>) {
    return prisma.announcement.update({ where: { id }, data });
  },

  async getAnnouncements(filters: any) {
    return prisma.announcement.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } }
    });
  },

  /**
   * Resolves the audience for an announcement and dispatches notifications
   */
  async publishAnnouncement(announcementId: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    });

    if (!announcement) throw new Error('Announcement not found');
    
    // Resolve audience to User IDs
    let userIds: string[] = [];

    switch (announcement.targetAudience) {
      case 'ALL_USERS':
        const allUsers = await prisma.user.findMany({ select: { id: true } });
        userIds = allUsers.map(u => u.id);
        break;

      case 'STUDENTS':
        const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true } });
        userIds = students.map(u => u.id);
        break;

      case 'FACULTY':
        const faculty = await prisma.user.findMany({ where: { role: 'FACULTY' }, select: { id: true } });
        userIds = faculty.map(u => u.id);
        break;

      case 'ADMINS':
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
        userIds = admins.map(u => u.id);
        break;

      case 'CLASS':
        if (!announcement.targetId) throw new Error('targetId is required for CLASS audience');
        const classStudents = await prisma.student.findMany({
          where: { classId: announcement.targetId },
          select: { userId: true }
        });
        userIds = classStudents.map(s => s.userId);
        break;

      case 'DEPARTMENT':
        if (!announcement.targetId) throw new Error('targetId is required for DEPARTMENT audience');
        const deptStudents = await prisma.student.findMany({
          where: { departmentId: announcement.targetId },
          select: { userId: true }
        });
        const deptFaculty = await prisma.faculty.findMany({
          where: { departmentId: announcement.targetId },
          select: { userId: true }
        });
        userIds = [...deptStudents.map(s => s.userId), ...deptFaculty.map(f => f.userId)];
        break;
    }

    // Deduplicate
    userIds = [...new Set(userIds)];

    // Dispatch through Communication Hub
    for (const userId of userIds) {
      await notificationService.createNotification(
        userId,
        NotificationType.ANNOUNCEMENT,
        announcement.title,
        announcement.content,
        announcement.priority,
        { announcementId: announcement.id } // Metadata
      );
    }

    // Mark as published
    return prisma.announcement.update({
      where: { id: announcementId },
      data: { status: 'PUBLISHED' }
    });
  }
};
