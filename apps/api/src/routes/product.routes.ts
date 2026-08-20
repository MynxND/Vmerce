import { Router } from 'express';
import { StorePermission } from '@cc/types';
import { createProductSchema, productListQuerySchema, updateProductSchema } from '@cc/shared';
import { productController } from '../controllers/product.controller';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateBody, validateQuery } from '../middlewares/validate';
import { asyncHandler } from '../utils/async-handler';

/** Mounted at `/stores/:storeId/products` — `mergeParams` keeps :storeId visible. */
export const productRoutes = Router({ mergeParams: true });

productRoutes.get(
  '/',
  ...requireStoreAccess(StorePermission.PRODUCT_VIEW),
  validateQuery(productListQuerySchema),
  asyncHandler(productController.list),
);

productRoutes.post(
  '/',
  ...requireStoreAccess(StorePermission.PRODUCT_CREATE),
  validateBody(createProductSchema),
  asyncHandler(productController.create),
);

productRoutes.post(
  '/generate-variants',
  ...requireStoreAccess(StorePermission.PRODUCT_VIEW),
  productController.generateVariants,
);

productRoutes.get(
  '/:productId',
  ...requireStoreAccess(StorePermission.PRODUCT_VIEW),
  asyncHandler(productController.getById),
);

productRoutes.patch(
  '/:productId',
  ...requireStoreAccess(StorePermission.PRODUCT_EDIT),
  validateBody(updateProductSchema),
  asyncHandler(productController.update),
);

productRoutes.post(
  '/:productId/duplicate',
  ...requireStoreAccess(StorePermission.PRODUCT_CREATE),
  asyncHandler(productController.duplicate),
);

productRoutes.delete(
  '/:productId',
  ...requireStoreAccess(StorePermission.PRODUCT_DELETE),
  asyncHandler(productController.remove),
);
