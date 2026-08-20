import type { Request, Response } from 'express';
import type { CreateDiscountInput, PaginationQuery, UpdateDiscountInput } from '@cc/shared';
import { discountService } from '../services/discount.service';
import { created, noContent, success } from '../utils/response';

export const discountController = {
  async list(req: Request, res: Response): Promise<void> {
    success(
      res,
      await discountService.list(req.params.storeId!, req.query as unknown as PaginationQuery),
    );
  },

  async getById(req: Request, res: Response): Promise<void> {
    success(res, await discountService.getById(req.params.storeId!, req.params.discountId!));
  },

  async create(req: Request, res: Response): Promise<void> {
    const discount = await discountService.create(
      req.params.storeId!,
      req.body as CreateDiscountInput,
    );
    created(res, discount, 'Discount created');
  },

  async update(req: Request, res: Response): Promise<void> {
    const discount = await discountService.update(
      req.params.storeId!,
      req.params.discountId!,
      req.body as UpdateDiscountInput,
    );
    success(res, discount, 'Discount updated');
  },

  async remove(req: Request, res: Response): Promise<void> {
    await discountService.remove(req.params.storeId!, req.params.discountId!);
    noContent(res);
  },
};
