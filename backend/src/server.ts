/**
 * Server Entry Point
 * 
 * WHY THIS EXISTS:
 * This file imports the fully configured Express app and actually binds it to a network port.
 * It also handles graceful shutdowns and initial database connections.
 */

import app from './app';
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import { validateEnv } from './utils/env';
validateEnv();

import { prisma } from './utils/prisma';

import { initCronJobs } from './cron';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Attempt to connect to the database before starting the server.
    // Note: Prisma connects lazily by default, but $connect forces an immediate connection
    // which helps catch DB connection issues immediately on startup.
    await prisma.$connect();
    console.log('✅ Successfully connected to the database.');
    
    // Initialize background jobs
    initCronJobs();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Closed out remaining connections.');
      });
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
