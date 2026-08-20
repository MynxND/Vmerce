import { z } from 'zod';
import { handleSchema, slugSchema } from '@cc/shared';

/** Route-param schemas. Keeps id validation out of the controllers. */
export const storeIdParams = z.object({ storeId: z.string().min(1) });

export const storeProductParams = storeIdParams.extend({ productId: z.string().min(1) });
export const storeCollectionParams = storeIdParams.extend({ collectionId: z.string().min(1) });
export const storeOrderParams = storeIdParams.extend({ orderId: z.string().min(1) });
export const storeCustomerParams = storeIdParams.extend({ customerId: z.string().min(1) });
export const storeMediaParams = storeIdParams.extend({ mediaId: z.string().min(1) });
export const storePageParams = storeIdParams.extend({ pageId: z.string().min(1) });

export const handleParams = z.object({ handle: handleSchema });
export const handleSlugParams = handleParams.extend({ slug: slugSchema });
export const handleProductParams = handleParams.extend({ productSlug: slugSchema });
export const handleCollectionParams = handleParams.extend({ collectionSlug: slugSchema });

export const cartItemParams = z.object({ itemId: z.string().min(1) });

export const handleOrderParams = handleParams.extend({
  orderNumber: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, 'Invalid order number'),
});

export const storeChannelParams = storeIdParams.extend({ channelId: z.string().min(1) });
export const storeProofParams = storeIdParams.extend({ proofId: z.string().min(1) });

export const analyticsQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const storefrontListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
  collection: slugSchema.optional(),
});

export const publicOrderQuery = z.object({
  orderNumber: z.string().min(1),
  email: z.string().email(),
});
