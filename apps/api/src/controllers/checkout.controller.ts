import type { Request, Response } from 'express';
import type { CheckoutInput } from '@cc/shared';
import { checkoutService } from '../services/checkout.service';
import { created } from '../utils/response';

export const checkoutController = {
  async placeOrder(req: Request, res: Response): Promise<void> {
    const order = await checkoutService.placeOrder(req.body as CheckoutInput);
    created(res, order, 'Order placed');
  },
};
