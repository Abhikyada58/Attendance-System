import { prisma } from '../utils/prisma';
import { AttendanceStatus } from '@prisma/client';

export const loadFaceModels = async () => {
  console.log('Face-api models mocked. (TFJS Node 24 incompatibility on Windows bypassed).');
};

export const faceService = {
  async enrollFace(studentUserId: string, base64Image: string) {
    throw new Error('SYSTEM_ERROR: Face Recognition is temporarily disabled on this architecture (Node 24 Windows tfjs-node compatibility).');
  },
  
  async verifyFaceAttendance(studentUserId: string, sessionId: string, base64Image: string) {
    throw new Error('SYSTEM_ERROR: Face Recognition is temporarily disabled on this architecture.');
  }
};
