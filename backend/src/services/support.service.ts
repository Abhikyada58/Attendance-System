import { prisma } from '../utils/prisma';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';
import { notificationService } from './notification.service';
import { NotificationType, NotificationPriority } from '@prisma/client';

export const supportService = {
  
  // ==========================================
  // TICKETS
  // ==========================================

  async createTicket(data: { subject: string; description: string; category: TicketCategory; attachmentUrl?: string }, userId: string) {
    // Generate a unique ticket number
    const count = await prisma.supportTicket.count();
    const ticketNumber = `ATX-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    // Smart Routing Logic
    let priority: TicketPriority = TicketPriority.NORMAL;
    if (data.category === 'ACCOUNT' || data.category === 'TECHNICAL') priority = TicketPriority.HIGH;
    
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority,
        createdById: userId,
        status: TicketStatus.OPEN
      }
    });

    // Notify requester
    await notificationService.createNotification(
      userId,
      NotificationType.SYSTEM_NOTICE,
      `Ticket Created: ${ticketNumber}`,
      `Your support ticket "${data.subject}" has been received.`,
      NotificationPriority.NORMAL,
      { ticketId: ticket.id }
    );

    return ticket;
  },

  async getMyTickets(userId: string) {
    return prisma.supportTicket.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { name: true } }
      }
    });
  },

  async getTicketDetails(id: string, userId: string, role: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        assignedTo: { select: { name: true } },
        comments: {
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) throw new Error('Ticket not found');
    
    // IDOR Protection
    if (role === 'STUDENT' && ticket.createdById !== userId) {
      throw new Error('Unauthorized');
    }

    // Filter out internal comments for students
    if (role === 'STUDENT') {
      ticket.comments = ticket.comments.filter(c => !c.isInternal);
    }

    return ticket;
  },

  async addComment(ticketId: string, authorId: string, message: string, isInternal: boolean, role: string) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');

    if (role === 'STUDENT' && ticket.createdById !== authorId) throw new Error('Unauthorized');
    if (role === 'STUDENT' && isInternal) throw new Error('Students cannot post internal notes');

    const comment = await prisma.ticketComment.create({
      data: { ticketId, authorId, message, isInternal }
    });

    // If a student replies, change status to OPEN
    if (role === 'STUDENT' && (ticket.status === 'WAITING_FOR_USER' || ticket.status === 'RESOLVED')) {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'OPEN' }
      });
    }

    // If support replies (publicly), change status to WAITING_FOR_USER
    if (role !== 'STUDENT' && !isInternal && ticket.status === 'OPEN') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'WAITING_FOR_USER' }
      });

      // Notify student
      await notificationService.createNotification(
        ticket.createdById,
        NotificationType.SYSTEM_NOTICE,
        `Update on Ticket ${ticket.ticketNumber}`,
        `A support agent replied to your ticket.`,
        NotificationPriority.NORMAL,
        { ticketId }
      );
    }

    return comment;
  },

  // ==========================================
  // ADMIN / SUPPORT WORKFLOW
  // ==========================================

  async getAllTickets(filters: any) {
    return prisma.supportTicket.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        assignedTo: { select: { name: true } }
      }
    });
  },

  async updateTicketStatus(id: string, status: TicketStatus, userId: string) {
    const data: any = { status };
    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      data.closedAt = new Date();
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data
    });

    if (status === 'RESOLVED' || status === 'CLOSED') {
      await notificationService.createNotification(
        ticket.createdById,
        NotificationType.SYSTEM_NOTICE,
        `Ticket ${status}`,
        `Your ticket ${ticket.ticketNumber} has been marked as ${status.toLowerCase()}.`,
        NotificationPriority.NORMAL,
        { ticketId: ticket.id }
      );
    }

    return ticket;
  },
  
  async assignTicket(id: string, assignedToId: string) {
    return prisma.supportTicket.update({
      where: { id },
      data: { assignedToId }
    });
  },

  // ==========================================
  // KNOWLEDGE BASE
  // ==========================================

  async getPublishedArticles() {
    return prisma.knowledgeArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, category: true, content: true } // Usually content is truncated, but ok for MVP
    });
  }

};
