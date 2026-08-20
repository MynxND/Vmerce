import { Router } from 'express';
import { StorePermission } from '@cc/types';
import { orderListQuerySchema, updateOrderSchema } from '@cc/shared';
import { orderController } from '../controllers/order.controller';
import { paymentController } from '../controllers/payment.controller';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateBody, validateQuery } from '../middlewares/validate';
import { asyncHandler } from '../utils/async-handler';

export const orderRoutes = Router({ mergeParams: true });

orderRoutes.get(
  '/',
  ...requireStoreAccess(StorePermission.ORDER_VIEW),
  validateQuery(orderListQuerySchema),
  asyncHandler(orderController.list),
);

orderRoutes.get(
  '/:orderId',
  ...requireStoreAccess(StorePermission.ORDER_VIEW),
  asyncHandler(orderController.getById),
);

orderRoutes.patch(
  '/:orderId',
  ...requireStoreAccess(StorePermission.ORDER_UPDATE),
  validateBody(updateOrderSchema),
  asyncHandler(orderController.update),
);

// Slips submitted against a specific order, for the review panel.
orderRoutes.get(
  '/:orderId/payment-proofs',
  ...requireStoreAccess(StorePermission.ORDER_VIEW),
  asyncHandler(paymentController.listProofs),
);
