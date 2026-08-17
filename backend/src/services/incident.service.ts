/**
 * Incident Service — Module 26
 *
 * Manages the full incident lifecycle:
 * DETECTED → INVESTIGATING → MITIGATING → MONITORING → RESOLVED → CLOSED
 *
 * Incident numbers: INC-YYYY-NNNN (human-readable, not DB UUIDs)
 */

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';

// ─── Incident number generation ───────────────────────────────────────────────

async function generateIncidentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.incident.count({
    where: { incidentNumber: { startsWith: `INC-${year}-` } }
  });
  const seq = String(count + 1).padStart(4, '0');
  return `INC-${year}-${seq}`;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const incidentService = {

  async create(data: {
    title: string;
    description?: string;
    severity: IncidentSeverity;
    affectedService?: string;
    createdById: string;
  }) {
    const incidentNumber = await generateIncidentNumber();

    const incident = await prisma.incident.create({
      data: {
        incidentNumber,
        title: data.title,
        description: data.description,
        severity: data.severity,
        affectedService: data.affectedService,
        createdById: data.createdById,
      },
      include: { notes: true }
    });

    logger.warn('incident', 'INCIDENT_CREATED',
      `Incident created: ${incidentNumber} — ${data.title}`,
      { metadata: { incidentNumber, severity: data.severity, affectedService: data.affectedService } }
    );

    return incident;
  },

  async getAll(opts: { status?: IncidentStatus; severity?: IncidentSeverity; page?: number; limit?: number }) {
    const { status, severity, page = 1, limit = 20 } = opts;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where, skip, take: limit,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: { notes: { orderBy: { createdAt: 'desc' }, take: 1 } }
      }),
      prisma.incident.count({ where })
    ]);

    return { incidents, total, page, limit };
  },

  async getById(id: string) {
    return prisma.incident.findUnique({
      where: { id },
      include: { notes: { orderBy: { createdAt: 'asc' } } }
    });
  },

  async updateStatus(id: string, status: IncidentStatus, actorId: string) {
    const now = new Date();
    const timestamps: any = {};

    if (status === 'INVESTIGATING') timestamps.acknowledgedAt = now;
    if (status === 'RESOLVED')      timestamps.resolvedAt = now;
    if (status === 'CLOSED')        timestamps.closedAt = now;

    const incident = await prisma.incident.update({
      where: { id },
      data: { status, ...timestamps },
      include: { notes: true }
    });

    logger.info('incident', 'INCIDENT_UPDATED',
      `Incident ${incident.incidentNumber} → ${status}`,
      { metadata: { incidentNumber: incident.incidentNumber, status, actorId } }
    );

    return incident;
  },

  async update(id: string, data: {
    title?: string;
    description?: string;
    severity?: IncidentSeverity;
    affectedService?: string;
    assignedToId?: string;
    rootCause?: string;
    impactSummary?: string;
    preventionNotes?: string;
  }) {
    return prisma.incident.update({
      where: { id },
      data,
      include: { notes: { orderBy: { createdAt: 'asc' } } }
    });
  },

  async addNote(incidentId: string, authorId: string, content: string) {
    const note = await prisma.incidentNote.create({
      data: { incidentId, authorId, content }
    });

    const incident = await prisma.incident.findUnique({ where: { id: incidentId }, select: { incidentNumber: true } });
    logger.info('incident', 'INCIDENT_NOTE_ADDED', `Note added to ${incident?.incidentNumber}`,
      { metadata: { incidentId, authorId } }
    );

    return note;
  },

  /** Summary statistics for monitoring dashboard */
  async getSummary() {
    const [open, investigating, mitigating, resolvedToday, totalThisMonth] = await Promise.all([
      prisma.incident.count({ where: { status: { in: ['DETECTED', 'INVESTIGATING', 'MITIGATING', 'MONITORING'] } } }),
      prisma.incident.count({ where: { status: 'INVESTIGATING' } }),
      prisma.incident.count({ where: { status: 'MITIGATING' } }),
      prisma.incident.count({ where: { status: 'RESOLVED', resolvedAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) } } }),
      prisma.incident.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60_000) } } }),
    ]);

    const bySeverity = await prisma.incident.groupBy({
      by: ['severity'],
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
      _count: true
    });

    return { open, investigating, mitigating, resolvedToday, totalThisMonth, bySeverity };
  }
};
