/**
 * Prisma Client Singleton Configuration
 * 
 * WHY THIS EXISTS:
 * In a development environment, hot-reloading (like with ts-node-dev or Next.js) 
 * can cause multiple instances of the Prisma Client to be instantiated. 
 * This quickly exhausts the database connection limit.
 * 
 * HOW IT WORKS:
 * We store the Prisma Client instance on the global object. 
 * If it already exists, we reuse it. Otherwise, we create a new one.
 * In production, we always create a new instance because the app only starts once.
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Log queries in development for debugging
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
