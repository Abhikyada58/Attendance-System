/**
 * User Service
 * 
 * Handles business logic for user profiles and admin operations.
 */

import { prisma } from '../utils/prisma';
import { AccountStatus } from '@prisma/client';

export const userService = {
  
  /**
   * Fetch the complete profile of the authenticated user.
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        student: {
          include: {
            institute: true,
            department: true,
            currentSem: true,
          }
        },
        faculty: {
          include: {
            institute: true,
            department: true,
          }
        }
      }
    });

    if (!user) throw new Error('User not found');
    return user;
  },

  /**
   * Allows a user to safely update their own profile fields.
   * Does NOT allow modification of sensitive fields like role or status.
   */
  async updateProfile(userId: string, data: { name?: string }) {
    // Only pass explicitly allowed fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      }
    });
    
    return updatedUser;
  },

  /**
   * [ADMIN ONLY] List all users with basic info
   */
  async listUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * [ADMIN ONLY] Update a user's account status (e.g., ACTIVE -> SUSPENDED)
   */
  async updateUserStatus(targetUserId: string, newStatus: AccountStatus, adminId: string) {
    // Prevent an admin from accidentally suspending themselves
    if (targetUserId === adminId && newStatus === 'SUSPENDED') {
      throw new Error('You cannot suspend your own admin account.');
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: newStatus },
      select: {
        id: true,
        email: true,
        status: true,
        role: true,
      }
    });

    return updatedUser;
  }
};
