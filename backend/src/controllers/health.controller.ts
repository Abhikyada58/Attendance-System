import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const checkHealth = async (req: Request, res: Response) => {
  try {
    // Attempt a lightweight database query to verify persistence connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: 'System is healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'System is unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
};
