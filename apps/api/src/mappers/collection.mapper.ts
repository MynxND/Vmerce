import type { Collection } from '@prisma/client';
import type { CollectionDto, CollectionStatus } from '@cc/types';

export function toCollectionDto(collection: Collection, productCount: number): CollectionDto {
  return {
    id: collection.id,
    storeId: collection.storeId,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    imageUrl: collection.imageUrl,
    status: collection.status as CollectionStatus,
    position: collection.position,
    productCount,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}
