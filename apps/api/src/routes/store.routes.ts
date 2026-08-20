import { Router } from 'express';
import { StorePermission } from '@cc/types';
import {
  checkHandleSchema,
  createStoreSchema,
  onboardingSchema,
  updatePageSectionsSchema,
  updateStoreSchema,
  updateThemeSchema,
} from '@cc/shared';
import { storeController } from '../controllers/store.controller';
import { paymentController } from '../controllers/payment.controller';
import { productRoutes } from './product.routes';
import { collectionRoutes } from './collection.routes';
import { orderRoutes } from './order.routes';
import { customerRoutes } from './customer.routes';
import { analyticsRoutes } from './analytics.routes';
import { mediaRoutes } from './media.routes';
import { discountRoutes } from './discount.routes';
import { teamRoutes } from './team.routes';
import { paymentRoutes } from './payment.routes';
import { requireAuth } from '../middlewares/auth';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate';
import { storeIdParams, storePageParams } from '../validators/params';
import { asyncHandler } from '../utils/async-handler';

export const storeRoutes = Router();

// Everything below requires a signed-in user.
storeRoutes.use(requireAuth);

storeRoutes.get('/', asyncHandler(storeController.list));
storeRoutes.post('/', validateBody(createStoreSchema), asyncHandler(storeController.create));
storeRoutes.post(
  '/onboarding',
  validateBody(onboardingSchema),
  asyncHandler(storeController.onboard),
);
storeRoutes.get(
  '/check-handle',
  validateQuery(checkHandleSchema),
  asyncHandler(storeController.checkHandle),
);
storeRoutes.get('/theme-presets', storeController.presets);
storeRoutes.get('/section-library', storeController.sectionLibrary);
storeRoutes.get('/banks', paymentController.banks);

// ---------------------------------------------------------------------------
// Store-scoped. `requireStoreAccess` resolves :storeId against the caller's
// memberships before any controller runs.
// ---------------------------------------------------------------------------
storeRoutes.get(
  '/:storeId',
  validateParams(storeIdParams),
  ...requireStoreAccess(StorePermission.STORE_VIEW),
  asyncHandler(storeController.getById),
);

storeRoutes.patch(
  '/:storeId',
  validateParams(storeIdParams),
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  validateBody(updateStoreSchema),
  asyncHandler(storeController.update),
);

storeRoutes.get(
  '/:storeId/theme',
  validateParams(storeIdParams),
  ...requireStoreAccess(StorePermission.STORE_VIEW),
  asyncHandler(storeController.getTheme),
);

storeRoutes.patch(
  '/:storeId/theme',
  validateParams(storeIdParams),
  ...requireStoreAccess(StorePermission.THEME_EDIT),
  validateBody(updateThemeSchema),
  asyncHandler(storeController.updateTheme),
);

storeRoutes.get(
  '/:storeId/pages',
  validateParams(storeIdParams),
  ...requireStoreAccess(StorePermission.STORE_VIEW),
  asyncHandler(storeController.listPages),
);

storeRoutes.get(
  '/:storeId/pages/:pageId',
  validateParams(storePageParams),
  ...requireStoreAccess(StorePermission.STORE_VIEW),
  asyncHandler(storeController.getPage),
);

storeRoutes.patch(
  '/:storeId/pages/:pageId',
  validateParams(storePageParams),
  ...requireStoreAccess(StorePermission.THEME_EDIT),
  validateBody(updatePageSectionsSchema),
  asyncHandler(storeController.updatePage),
);

storeRoutes.use('/:storeId/products', validateParams(storeIdParams), productRoutes);
storeRoutes.use('/:storeId/collections', validateParams(storeIdParams), collectionRoutes);
storeRoutes.use('/:storeId/orders', validateParams(storeIdParams), orderRoutes);
storeRoutes.use('/:storeId/customers', validateParams(storeIdParams), customerRoutes);
storeRoutes.use('/:storeId/analytics', validateParams(storeIdParams), analyticsRoutes);
storeRoutes.use('/:storeId/media', validateParams(storeIdParams), mediaRoutes);
storeRoutes.use('/:storeId/discounts', validateParams(storeIdParams), discountRoutes);
storeRoutes.use('/:storeId/team', validateParams(storeIdParams), teamRoutes);
storeRoutes.use('/:storeId/payments', validateParams(storeIdParams), paymentRoutes);
