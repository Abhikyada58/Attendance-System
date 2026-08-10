import { prisma } from '../utils/prisma';
import { NotificationType, NotificationPriority } from '@prisma/client';

export const notificationService = {
  
  async createNotification(userId: string, type: NotificationType, title: string, message: string, priority: NotificationPriority = 'NORMAL', metadata?: any) {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        priority,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      }
    });
  },

  async getNotifications(userId: string, page: number = 1, limit: number = 20, unreadOnly: boolean = false) {
    const skip = (page - 1) * limit;
    
    const whereClause: any = { userId };
    if (unreadOnly) {
      whereClause.readAt = null;
    }

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where: whereClause })
    ]);

    return {
      notifications: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: { userId, readAt: null }
    });
    return { count };
  },

  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.userId !== userId) {
      throw new Error('NOT_FOUND: Notification not found or access denied');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });
  },

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() }
    });
  },

  async getPreferences(userId: string) {
    let pref = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (!pref) {
      pref = await prisma.notificationPreference.create({
        data: { userId }
      });
    }
    return pref;
  },

  async updatePreferences(userId: string, data: { emailEnabled?: boolean, attendanceAlertsEnabled?: boolean, systemAlertsEnabled?: boolean }) {
    return await prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });
  }
};
