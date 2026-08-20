import type { Request, Response } from 'express';
import type { PaginationQuery } from '@cc/shared';
import { customerService } from '../services/customer.service';
import { success } from '../utils/response';

export const customerController = {
  async list(req: Request, res: Response): Promise<void> {
    success(
      res,
      await customerService.list(req.params.storeId!, req.query as unknown as PaginationQuery),
    );
  },

  async getById(req: Request, res: Response): Promise<void> {
    success(res, await customerService.getById(req.params.storeId!, req.params.customerId!));
  },
};
