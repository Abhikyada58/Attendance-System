/**
 * API Response Utilities
 * 
 * WHY THIS EXISTS:
 * A predictable response structure is crucial for the frontend developer. 
 * It means they know exactly where to look for data, messages, or errors 
 * without having to guess the shape of the JSON object.
 */

import { Response } from 'express';

// Standardized success response structure
export const sendSuccess = (res: Response, statusCode: number, data: any, message: string = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Standardized error response structure
export const sendError = (res: Response, statusCode: number, message: string, errorCode?: string) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code: errorCode || 'INTERNAL_ERROR',
    },
  });
};
