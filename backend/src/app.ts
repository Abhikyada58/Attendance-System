/**
 * Express Application Configuration
 * 
 * WHY THIS EXISTS:
 * This file is solely responsible for creating and configuring the Express app.
 * By separating `app.ts` from `server.ts`, we can easily import `app` into our
 * testing framework (like Supertest) without actually starting the HTTP server on a port.
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import rootRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

import rateLimit from 'express-rate-limit';

const app: Express = express();

// Global rate limiting to prevent brute force attacks
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 min per IP
  skip: () => process.env.NODE_ENV !== 'production', // Disable entirely in dev/test
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests from this IP, please try again later.' } }
});
app.use(globalLimiter);

// --- Global Middleware ---
// Parse incoming JSON payloads
app.use(express.json());
// Parse URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true }));

// Security headers (protects against XSS, clickjacking, etc.)
app.use(helmet());

// CORS configuration (allow frontend to communicate with backend)
// In production, you would restrict the origin to your specific frontend URL
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://your-production-url.com' : '*',
  credentials: true,
}));

// Request logging (dev mode prints concise output colored by status code)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --- API Routes ---
// Mount the global API router at /api
app.use('/api', rootRouter);

// --- Error Handling ---
// Catch requests that don't match any route
app.use(notFoundHandler);

// Centralized error handling must be the last middleware mounted
app.use(errorHandler);

export default app;
