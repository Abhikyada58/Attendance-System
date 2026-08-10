import { prisma } from '../utils/prisma';

export const auditService = {
  async logAction(actorUserId: string, action: string, entityType: string, entityId: string, metadata?: any) {
    return await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      }
    });
  },

  async getAuditLogs(page: number = 1, limit: number = 20, filter?: { action?: string, entityType?: string }) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (filter?.action) where.action = filter.action;
    if (filter?.entityType) where.entityType = filter.entityType;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs: data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};
