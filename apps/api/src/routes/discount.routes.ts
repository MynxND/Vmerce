import { Router } from 'express';
import { StorePermission } from '@cc/types';
import { createDiscountSchema, paginationQuerySchema, updateDiscountSchema } from '@cc/shared';
import { discountController } from '../controllers/discount.controller';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateBody, validateQuery } from '../middlewares/validate';
import { asyncHandler } from '../utils/async-handler';

/**
 * Discounts are a settings-level concern, so they sit behind SETTINGS_EDIT for
 * writes rather than the product permissions.
 */
export const discountRoutes = Router({ mergeParams: true });

discountRoutes.get(
  '/',
  ...requireStoreAccess(StorePermission.STORE_VIEW),
  validateQuery(paginationQuerySchema),
  asyncHandler(discountController.list),
);

discountRoutes.post(
  '/',
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  validateBody(createDiscountSchema),
  asyncHandler(discountController.create),
);

discountRoutes.get(
  '/:discountId',
  ...requireStoreAccess(StorePermission.STORE_VIEW),
  asyncHandler(discountController.getById),
);

discountRoutes.patch(
  '/:discountId',
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  validateBody(updateDiscountSchema),
  asyncHandler(discountController.update),
);

discountRoutes.delete(
  '/:discountId',
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  asyncHandler(discountController.remove),
);
