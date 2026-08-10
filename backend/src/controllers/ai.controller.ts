import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { aiService } from '../services/ai.service';

export const aiController = {
  async getStudentInsights(req: Request, res: Response) {
    try {
      const insights = await aiService.getStudentPredictiveInsights(req.user!.userId);
      return sendSuccess(res, 200, insights, 'Student AI Insights generated successfully');
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  },

  async getFacultyInsights(req: Request, res: Response) {
    try {
      const insights = await aiService.getFacultyPredictiveInsights(req.user!.userId);
      return sendSuccess(res, 200, insights, 'Faculty AI Insights generated successfully');
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  },

  async getAdminInsights(req: Request, res: Response) {
    try {
      const insights = await aiService.getAdminPredictiveInsights();
      return sendSuccess(res, 200, insights, 'Admin AI Insights generated successfully');
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }
};
