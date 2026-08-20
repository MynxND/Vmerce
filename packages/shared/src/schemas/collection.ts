import { z } from 'zod';
import { CollectionStatus } from '@cc/types';
import { nullableUrlSchema, slugSchema } from './common';

export const createCollectionSchema = z.object({
  name: z.string().trim().min(2, 'At least 2 characters').max(80),
  slug: slugSchema.optional(),
  description: z.string().trim().max(2000).nullish(),
  imageUrl: nullableUrlSchema,
  status: z.nativeEnum(CollectionStatus).default(CollectionStatus.ACTIVE),
  productIds: z.array(z.string()).max(500).default([]),
});
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = createCollectionSchema.partial().extend({
  position: z.number().int().min(0).optional(),
});
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export const reorderCollectionsSchema = z.object({
  ids: z.array(z.string()).min(1),
});
