/**
 * Structured Logger — Module 26
 *
 * Design principles:
 * - Structured JSON output (machine-readable)
 * - Automatic redaction of sensitive fields
 * - Log levels: DEBUG, INFO, WARN, ERROR, FATAL
 * - Never logs: passwords, tokens, biometric data, full request bodies
 * - requestId propagated for correlation
 * - PII minimized: uses userId (UUID) not email/name
 *
 * In development: pretty-print to console
 * In production: emit structured JSON to stdout (for log aggregators)
 */

import { prisma } from './prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface LogEntry {
  level: LogLevel;
  service: string;
  event: string;
  message: string;
  requestId?: string;
  userId?: string;    // internal UUID only — never email
  duration?: number;  // ms
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    // stack only in development, never in production logs
  };
}

// ─── Sensitive Field Redaction ────────────────────────────────────────────────

const REDACTED = '[REDACTED]';

/** Fields that must NEVER appear in logs */
const SENSITIVE_KEYS = new Set([
  'password', 'passwordHash', 'passwordPlaintext',
  'token', 'accessToken', 'refreshToken', 'tokenHash', 'jwtToken',
  'authorization', 'cookie', 'secret', 'apiKey', 'privateKey',
  'embedding', 'faceEmbedding', 'biometric', 'faceData',
  'creditCard', 'ssn', 'nationalId',
]);

function redact(obj: any, depth = 0): any {
  if (depth > 5) return '[DEEP_OBJECT]'; // prevent circular refs
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.slice(0, 10).map(i => redact(i, depth + 1)); // limit arrays

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || SENSITIVE_KEYS.has(key)) {
      result[key] = REDACTED;
    } else {
      result[key] = redact(value, depth + 1);
    }
  }
  return result;
}

// ─── Log Level Priority ───────────────────────────────────────────────────────

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, FATAL: 4
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

// ─── Output ───────────────────────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV !== 'production';

const LEVEL_COLORS: Record<LogLevel, string> = {
  DEBUG: '\x1b[36m',  // cyan
  INFO:  '\x1b[32m',  // green
  WARN:  '\x1b[33m',  // yellow
  ERROR: '\x1b[31m',  // red
  FATAL: '\x1b[35m',  // magenta
};
const RESET = '\x1b[0m';

function writeLog(entry: LogEntry & { timestamp: string }) {
  if (IS_DEV) {
    const color = LEVEL_COLORS[entry.level] || '';
    const prefix = `${color}[${entry.level}]${RESET} ${entry.timestamp} [${entry.service}] ${entry.event}`;
    const meta = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    const dur = entry.duration !== undefined ? ` (${entry.duration}ms)` : '';
    const req = entry.requestId ? ` req:${entry.requestId.slice(0, 8)}` : '';
    process.stdout.write(`${prefix}: ${entry.message}${dur}${req}${meta}\n`);
  } else {
    // Structured JSON for log aggregators (Datadog, CloudWatch, etc.)
    process.stdout.write(JSON.stringify(entry) + '\n');
  }
}

// ─── Persistent DB Logging (important events only) ───────────────────────────

const PERSIST_LEVELS: Set<LogLevel> = new Set(['WARN', 'ERROR', 'FATAL']);

async function persistLog(entry: LogEntry): Promise<void> {
  try {
    await prisma.appLog.create({
      data: {
        level: entry.level as any,
        service: entry.service,
        event: entry.event,
        message: entry.message.slice(0, 500),
        requestId: entry.requestId,
        userId: entry.userId,
        duration: entry.duration,
        metadata: entry.metadata ? JSON.parse(JSON.stringify(redact(entry.metadata))) : undefined,
      }
    });
  } catch {
    // Logging must never crash the application
  }
}

// ─── Public Logger API ────────────────────────────────────────────────────────

function log(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const timestamp = new Date().toISOString();
  const safeEntry = {
    ...entry,
    timestamp,
    metadata: entry.metadata ? redact(entry.metadata) : undefined,
  };

  writeLog(safeEntry);

  // Persist WARN/ERROR/FATAL to database asynchronously (fire-and-forget)
  if (PERSIST_LEVELS.has(entry.level)) {
    persistLog(entry).catch(() => {});
  }
}

export const logger = {
  debug: (service: string, event: string, message: string, meta?: Omit<LogEntry, 'level' | 'service' | 'event' | 'message'>) =>
    log({ level: 'DEBUG', service, event, message, ...meta }),

  info: (service: string, event: string, message: string, meta?: Omit<LogEntry, 'level' | 'service' | 'event' | 'message'>) =>
    log({ level: 'INFO', service, event, message, ...meta }),

  warn: (service: string, event: string, message: string, meta?: Omit<LogEntry, 'level' | 'service' | 'event' | 'message'>) =>
    log({ level: 'WARN', service, event, message, ...meta }),

  error: (service: string, event: string, message: string, err?: Error, meta?: Omit<LogEntry, 'level' | 'service' | 'event' | 'message'>) =>
    log({
      level: 'ERROR', service, event, message, ...meta,
      error: err ? { name: err.name, message: err.message } : undefined,
      metadata: {
        ...(meta?.metadata || {}),
        // Only include stack in development
        ...(IS_DEV && err ? { stack: err.stack?.split('\n').slice(0, 5).join(' | ') } : {})
      }
    }),

  fatal: (service: string, event: string, message: string, err?: Error, meta?: Omit<LogEntry, 'level' | 'service' | 'event' | 'message'>) =>
    log({ level: 'FATAL', service, event, message, ...meta, error: err ? { name: err.name, message: err.message } : undefined }),

  /** Search logs from DB — admin only */
  async search(opts: { level?: string; service?: string; event?: string; requestId?: string; limit?: number; since?: Date }) {
    const where: any = {};
    if (opts.level) where.level = opts.level;
    if (opts.service) where.service = opts.service;
    if (opts.event) where.event = { contains: opts.event };
    if (opts.requestId) where.requestId = opts.requestId;
    if (opts.since) where.createdAt = { gte: opts.since };

    return prisma.appLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.limit || 50,
    });
  }
};
