import { Router } from 'express';
import { StorePermission } from '@cc/types';
import { paginationQuerySchema } from '@cc/shared';
import { customerController } from '../controllers/customer.controller';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateQuery } from '../middlewares/validate';
import { asyncHandler } from '../utils/async-handler';

export const customerRoutes = Router({ mergeParams: true });

customerRoutes.get(
  '/',
  ...requireStoreAccess(StorePermission.CUSTOMER_VIEW),
  validateQuery(paginationQuerySchema),
  asyncHandler(customerController.list),
);

customerRoutes.get(
  '/:customerId',
  ...requireStoreAccess(StorePermission.CUSTOMER_VIEW),
  asyncHandler(customerController.getById),
);
