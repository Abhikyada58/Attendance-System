/**
 * Server Entry Point — Module 26 Hardened
 *
 * Changes:
 * - Structured startup/shutdown logging via logger
 * - Metrics persistence cron (every 5 min)
 * - Graceful shutdown waits for in-flight requests
 */

import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { validateEnv } from './utils/env';
import { prisma } from './utils/prisma';
import { initCronJobs } from './cron';
import { logger } from './utils/logger';
import { metrics } from './services/metrics.service';

validateEnv();

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('database', 'APPLICATION_STARTED', 'Database connected successfully');

    // Initialize background cron jobs
    initCronJobs();

    // Persist metrics snapshot every 5 minutes
    setInterval(() => {
      metrics.persistMetricSnapshot().catch(() => {});
    }, 5 * 60_000);

    const server = app.listen(PORT, () => {
      logger.info('server', 'APPLICATION_STARTED',
        `AttendX backend running on port ${PORT}`, {
          metadata: { port: PORT, env: process.env.NODE_ENV, nodeVersion: process.version }
        });
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.warn('server', 'APPLICATION_STOPPED', `Shutdown signal received: ${signal}`);

      server.close(async () => {
        logger.info('server', 'APPLICATION_STOPPED', 'HTTP server closed');
        await prisma.$disconnect();
        logger.info('database', 'APPLICATION_STOPPED', 'Database disconnected');
        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => process.exit(1), 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Catch unhandled promise rejections (prevents silent failures)
    process.on('unhandledRejection', (reason: any) => {
      logger.fatal('server', 'UNHANDLED_REJECTION',
        `Unhandled Promise Rejection: ${reason?.message || reason}`,
        reason instanceof Error ? reason : undefined
      );
    });

    process.on('uncaughtException', (err) => {
      logger.fatal('server', 'UNCAUGHT_EXCEPTION', `Uncaught Exception: ${err.message}`, err);
      process.exit(1);
    });

  } catch (error: any) {
    logger.fatal('server', 'APPLICATION_STARTED', `Failed to start server: ${error.message}`, error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
