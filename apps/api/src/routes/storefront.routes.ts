import { Router } from 'express';
import multer from 'multer';
import {
  addCartItemSchema,
  applyDiscountSchema,
  checkoutSchema,
  submitPaymentProofSchema,
  updateCartItemSchema,
} from '@cc/shared';
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES } from '../config/constants';
import { paymentController } from '../controllers/payment.controller';
import { authRateLimit } from '../middlewares/rate-limit';
import { ApiError } from '../utils/errors';
import { storefrontController } from '../controllers/storefront.controller';
import { cartController } from '../controllers/cart.controller';
import { checkoutController } from '../controllers/checkout.controller';
import { resolveCartToken } from '../middlewares/cart-token';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate';
import {
  cartItemParams,
  handleCollectionParams,
  handleParams,
  handleProductParams,
  handleOrderParams,
  publicOrderQuery,
  storefrontListQuery,
} from '../validators/params';
import { asyncHandler } from '../utils/async-handler';

/**
 * Public, unauthenticated storefront API. Only ACTIVE stores, ACTIVE products
 * and ACTIVE collections are ever returned.
 */
export const storefrontRoutes = Router();

// Slip uploads come from anonymous buyers, so the same tight budget as the
// credential endpoints applies, and only image types are accepted.
const slipUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      callback(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    callback(null, true);
  },
});

storefrontRoutes.use(resolveCartToken);

storefrontRoutes.get(
  '/:handle',
  validateParams(handleParams),
  asyncHandler(storefrontController.getStore),
);
storefrontRoutes.get(
  '/:handle/home',
  validateParams(handleParams),
  asyncHandler(storefrontController.getHome),
);
storefrontRoutes.get(
  '/:handle/products',
  validateParams(handleParams),
  validateQuery(storefrontListQuery),
  asyncHandler(storefrontController.listProducts),
);
storefrontRoutes.get(
  '/:handle/products/:productSlug',
  validateParams(handleProductParams),
  asyncHandler(storefrontController.getProduct),
);
storefrontRoutes.get(
  '/:handle/collections',
  validateParams(handleParams),
  asyncHandler(storefrontController.listCollections),
);
storefrontRoutes.get(
  '/:handle/collections/:collectionSlug',
  validateParams(handleCollectionParams),
  asyncHandler(storefrontController.getCollection),
);
storefrontRoutes.get(
  '/:handle/checkout-options',
  validateParams(handleParams),
  asyncHandler(storefrontController.checkoutOptions),
);
storefrontRoutes.get(
  '/:handle/order-lookup',
  validateParams(handleParams),
  validateQuery(publicOrderQuery),
  asyncHandler(storefrontController.lookupOrder),
);

// ---- cart -----------------------------------------------------------------
storefrontRoutes.get(
  '/:handle/cart',
  validateParams(handleParams),
  asyncHandler(cartController.getOrCreate),
);
storefrontRoutes.post(
  '/:handle/cart/items',
  validateParams(handleParams),
  validateBody(addCartItemSchema),
  asyncHandler(cartController.addItem),
);
storefrontRoutes.patch(
  '/:handle/cart/items/:itemId',
  validateParams(handleParams.merge(cartItemParams)),
  validateBody(updateCartItemSchema),
  asyncHandler(cartController.updateItem),
);
storefrontRoutes.delete(
  '/:handle/cart/items/:itemId',
  validateParams(handleParams.merge(cartItemParams)),
  asyncHandler(cartController.removeItem),
);
storefrontRoutes.post(
  '/:handle/cart/discount',
  validateParams(handleParams),
  validateBody(applyDiscountSchema),
  asyncHandler(cartController.applyDiscount),
);

// ---- checkout -------------------------------------------------------------
storefrontRoutes.post(
  '/:handle/checkout',
  validateParams(handleParams),
  validateBody(checkoutSchema),
  asyncHandler(checkoutController.placeOrder),
);

// ---- payment slip ---------------------------------------------------------
storefrontRoutes.post(
  '/:handle/orders/:orderNumber/payment-proof',
  authRateLimit,
  validateParams(handleOrderParams),
  slipUpload.single('slip'),
  validateBody(submitPaymentProofSchema),
  asyncHandler(paymentController.submitProof),
);
