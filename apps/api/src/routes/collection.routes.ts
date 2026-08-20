import { Router } from 'express';
import { StorePermission } from '@cc/types';
import {
  createCollectionSchema,
  paginationQuerySchema,
  reorderCollectionsSchema,
  updateCollectionSchema,
} from '@cc/shared';
import { collectionController } from '../controllers/collection.controller';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateBody, validateQuery } from '../middlewares/validate';
import { asyncHandler } from '../utils/async-handler';

export const collectionRoutes = Router({ mergeParams: true });

collectionRoutes.get(
  '/',
  ...requireStoreAccess(StorePermission.PRODUCT_VIEW),
  validateQuery(paginationQuerySchema),
  asyncHandler(collectionController.list),
);

collectionRoutes.post(
  '/',
  ...requireStoreAccess(StorePermission.PRODUCT_CREATE),
  validateBody(createCollectionSchema),
  asyncHandler(collectionController.create),
);

collectionRoutes.post(
  '/reorder',
  ...requireStoreAccess(StorePermission.PRODUCT_EDIT),
  validateBody(reorderCollectionsSchema),
  asyncHandler(collectionController.reorder),
);

collectionRoutes.get(
  '/:collectionId',
  ...requireStoreAccess(StorePermission.PRODUCT_VIEW),
  asyncHandler(collectionController.getById),
);

collectionRoutes.patch(
  '/:collectionId',
  ...requireStoreAccess(StorePermission.PRODUCT_EDIT),
  validateBody(updateCollectionSchema),
  asyncHandler(collectionController.update),
);

collectionRoutes.delete(
  '/:collectionId',
  ...requireStoreAccess(StorePermission.PRODUCT_DELETE),
  asyncHandler(collectionController.remove),
);
