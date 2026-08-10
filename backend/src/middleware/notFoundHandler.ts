/**
 * 404 Not Found Handler
 * 
 * WHY THIS EXISTS:
 * When a client requests a route that does not exist in our API,
 * Express by default returns an HTML response. Since this is a JSON API,
 * we need to intercept unknown routes and return a structured JSON 404 error.
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  sendError(res, 404, `API Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND');
};
