/**
 * Centralized Error Handling Middleware
 * 
 * WHY THIS EXISTS:
 * Uncaught exceptions or thrown errors in routes/controllers shouldn't crash the server.
 * This middleware catches them, logs them appropriately, and sends a safe JSON response
 * back to the client without leaking sensitive stack traces in production.
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error for internal debugging
  console.error(`[Error] ${err.name}: ${err.message}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack); // Only log stack trace in dev
  }

  // Determine status code based on error properties, default to 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;
  
  // Clean message for production vs development
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? 'Internal Server Error' 
    : err.message || 'An unexpected error occurred';

  sendError(res, statusCode, message, err.code);
};
