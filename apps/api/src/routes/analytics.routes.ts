import { Router } from 'express';
import { StorePermission } from '@cc/types';
import { analyticsController } from '../controllers/analytics.controller';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateQuery } from '../middlewares/validate';
import { analyticsQuery } from '../validators/params';
import { asyncHandler } from '../utils/async-handler';

export const analyticsRoutes = Router({ mergeParams: true });

analyticsRoutes.get(
  '/overview',
  ...requireStoreAccess(StorePermission.ANALYTICS_VIEW),
  validateQuery(analyticsQuery),
  asyncHandler(analyticsController.overview),
);
