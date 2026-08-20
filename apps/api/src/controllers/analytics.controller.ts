import type { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { success } from '../utils/response';

export const analyticsController = {
  async overview(req: Request, res: Response): Promise<void> {
    const { days } = req.query as unknown as { days: number };
    success(res, await analyticsService.overview(req.params.storeId!, days));
  },
};
