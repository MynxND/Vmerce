import { Router } from 'express';
import { StorePermission } from '@cc/types';
import {
  createPaymentChannelSchema,
  reorderPaymentChannelsSchema,
  reviewPaymentProofSchema,
  updatePaymentChannelSchema,
} from '@cc/shared';
import { paymentController } from '../controllers/payment.controller';
import { requireStoreAccess } from '../middlewares/store-access';
import { validateBody } from '../middlewares/validate';
import { asyncHandler } from '../utils/async-handler';

/**
 * Payment channels hold the creator's own account identifiers, so reads are
 * gated at SETTINGS_EDIT rather than STORE_VIEW — staff who can edit products
 * have no reason to see the owner's bank details.
 */
export const paymentRoutes = Router({ mergeParams: true });

paymentRoutes.get(
  '/channels',
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  asyncHandler(paymentController.listChannels),
);

paymentRoutes.post(
  '/channels',
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  validateBody(createPaymentChannelSchema),
  asyncHandler(paymentController.createChannel),
);

paymentRoutes.post(
  '/channels/reorder',
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  validateBody(reorderPaymentChannelsSchema),
  asyncHandler(paymentController.reorderChannels),
);

paymentRoutes.get(
  '/channels/:channelId',
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  asyncHandler(paymentController.getChannel),
);

paymentRoutes.patch(
  '/channels/:channelId',
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  validateBody(updatePaymentChannelSchema),
  asyncHandler(paymentController.updateChannel),
);

paymentRoutes.delete(
  '/channels/:channelId',
  ...requireStoreAccess(StorePermission.SETTINGS_EDIT),
  asyncHandler(paymentController.removeChannel),
);

// Reviewing a slip is what marks an order paid, so it rides on ORDER_UPDATE.
paymentRoutes.get(
  '/pending-count',
  ...requireStoreAccess(StorePermission.ORDER_VIEW),
  asyncHandler(paymentController.pendingCount),
);

paymentRoutes.patch(
  '/proofs/:proofId',
  ...requireStoreAccess(StorePermission.ORDER_UPDATE),
  validateBody(reviewPaymentProofSchema),
  asyncHandler(paymentController.reviewProof),
);
