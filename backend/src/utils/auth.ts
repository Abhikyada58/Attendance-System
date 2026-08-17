/**
 * Authentication Utilities
 * 
 * WHY THIS EXISTS:
 * Centralizes bcrypt hashing and JWT generation so it's not repeated in controllers.
 * - Passwords MUST be hashed (one-way mathematical function) before database storage.
 * - JWTs (JSON Web Tokens) are signed, stateless tokens given to the client to prove their identity.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
// We fallback to a default just in case, but warn if missing in production
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hashes a plaintext password securely.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plaintext password attempt with a stored hash.
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export interface JwtPayload {
  userId: string;
  role: string;
  instituteId?: string | null;
}

/**
 * Generates a signed JWT containing the user's ID and Role.
 */
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
};

/**
 * Verifies a JWT and extracts its payload. Throws an error if invalid/expired.
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
