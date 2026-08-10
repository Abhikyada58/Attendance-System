/**
 * Auth Service Layer
 * 
 * WHY THIS EXISTS:
 * Business logic should not live in the controller. The controller's only job is to receive the request 
 * and send a response. The Service layer is where the "heavy lifting" happens. 
 * This makes the logic reusable and easier to test without needing a fake HTTP request.
 */

import { prisma } from '../utils/prisma';
import { hashPassword, verifyPassword, signToken } from '../utils/auth';
import { parseInstitutionalEmail } from '../utils/academicParser';

export const authService = {
  
  /**
   * Registers a new student by deriving academic details from their email.
   * Uses a Prisma Transaction to ensure either everything succeeds or everything fails cleanly.
   */
  async registerStudent(email: string, passwordPlaintext: string, name: string) {
    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('An account with this email already exists.');
    }

    // 2. Parse the institutional email
    const academicData = parseInstitutionalEmail(email);

    // 3. Hash the password securely
    const passwordHash = await hashPassword(passwordPlaintext);

    // 4. Perform database operations transactionally
    // Transaction ensures that if creating the Student fails, the User isn't left stranded.
    const result = await prisma.$transaction(async (tx) => {
      
      // Ensure the Institute exists (create it if not)
      const institute = await tx.institute.upsert({
        where: { code: academicData.instituteCode },
        update: {},
        create: {
          name: academicData.instituteCode + ' Institute',
          code: academicData.instituteCode,
        }
      });

      // Ensure the Department exists and link it to the institute
      const department = await tx.department.upsert({
        where: { code: academicData.departmentCode },
        update: {},
        create: {
          name: academicData.departmentCode + ' Department',
          code: academicData.departmentCode,
          instituteId: institute.id,
        }
      });

      // Create the User (base auth entity)
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: 'STUDENT',
        }
      });

      // Create the Student profile linked to the User and Academic structures
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: academicData.studentId,
          instituteId: institute.id,
          departmentId: department.id,
        }
      });

      return { user, student, academicData };
    });

    return result;
  },

  /**
   * Authenticates a user and returns a JWT if credentials are correct.
   */
  async login(email: string, passwordPlaintext: string) {
    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security: We throw a generic error to prevent email enumeration attacks
      throw new Error('Invalid email or password.');
    }

    // 2. Verify password hash
    const isMatch = await verifyPassword(passwordPlaintext, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    // 3. Generate JWT
    const token = signToken({ userId: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  },

  /**
   * Fetches the current user profile (for the /me endpoint)
   */
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        student: {
          include: {
            department: true,
            institute: true,
          }
        },
        faculty: true,
      }
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return user;
  }
};
