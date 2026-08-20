import type { Request, Response } from 'express';
import type { OrderListQuery, UpdateOrderInput } from '@cc/shared';
import { orderService } from '../services/order.service';
import { success } from '../utils/response';

export const orderController = {
  async list(req: Request, res: Response): Promise<void> {
    success(
      res,
      await orderService.list(req.params.storeId!, req.query as unknown as OrderListQuery),
    );
  },

  async getById(req: Request, res: Response): Promise<void> {
    success(res, await orderService.getById(req.params.storeId!, req.params.orderId!));
  },

  async update(req: Request, res: Response): Promise<void> {
    const order = await orderService.update(
      req.params.storeId!,
      req.params.orderId!,
      req.body as UpdateOrderInput,
    );
    success(res, order, 'Order updated');
  },
};
