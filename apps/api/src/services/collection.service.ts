import type { Prisma } from '@prisma/client';
import type { CollectionDto, Paginated } from '@cc/types';
import {
  slugify,
  type CreateCollectionInput,
  type PaginationQuery,
  type UpdateCollectionInput,
} from '@cc/shared';
import { prisma } from '../config/prisma';
import { collectionRepository } from '../repositories/collection.repository';
import { toCollectionDto } from '../mappers/collection.mapper';
import { ApiError } from '../utils/errors';
import { paginated } from '../utils/response';
import { uniqueSlug } from '../utils/slug';

/** Filters out ids belonging to another tenant before wiring them up. */
async function ownedProductIds(
  tx: Prisma.TransactionClient,
  storeId: string,
  productIds: string[],
): Promise<string[]> {
  if (productIds.length === 0) return [];
  const rows = await tx.product.findMany({
    where: { id: { in: productIds }, storeId },
    select: { id: true },
  });
  const owned = new Set(rows.map((row) => row.id));
  return productIds.filter((id) => owned.has(id));
}

export const collectionService = {
  async list(storeId: string, query: PaginationQuery): Promise<Paginated<CollectionDto>> {
    const where: Prisma.CollectionWhereInput = {};
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

    const { rows, total } = await collectionRepository.list({
      storeId,
      where,
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    });

    return paginated(
      rows.map((row) => toCollectionDto(row, row._count.products)),
      query.page,
      query.perPage,
      total,
    );
  },

  async getById(storeId: string, collectionId: string) {
    const collection = await collectionRepository.findById(storeId, collectionId);
    if (!collection) throw ApiError.notFound('Collection not found', 'COLLECTION_NOT_FOUND');
    return {
      ...toCollectionDto(collection, collection.products.length),
      productIds: collection.products.map((row) => row.productId),
    };
  },

  async create(storeId: string, input: CreateCollectionInput): Promise<CollectionDto> {
    const slug = await uniqueSlug(
      input.slug ?? slugify(input.name),
      (candidate) => collectionRepository.slugExists(storeId, candidate),
      'collection',
    );

    const collection = await prisma.$transaction(async (tx) => {
      const maxPosition = await tx.collection.aggregate({
        where: { storeId },
        _max: { position: true },
      });

      const created = await tx.collection.create({
        data: {
          storeId,
          name: input.name,
          slug,
          description: input.description ?? null,
          imageUrl: input.imageUrl ?? null,
          status: input.status,
          position: (maxPosition._max.position ?? -1) + 1,
        },
      });

      const productIds = await ownedProductIds(tx, storeId, input.productIds);
      if (productIds.length > 0) {
        await tx.collectionProduct.createMany({
          data: productIds.map((productId, index) => ({
            collectionId: created.id,
            productId,
            position: index,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return toCollectionDto(collection, input.productIds.length);
  },

  async update(
    storeId: string,
    collectionId: string,
    input: UpdateCollectionInput,
  ): Promise<CollectionDto> {
    const existing = await collectionRepository.findById(storeId, collectionId);
    if (!existing) throw ApiError.notFound('Collection not found', 'COLLECTION_NOT_FOUND');

    const slug =
      input.slug && input.slug !== existing.slug
        ? await uniqueSlug(
            input.slug,
            (candidate) => collectionRepository.slugExists(storeId, candidate),
            'collection',
          )
        : undefined;

    const collection = await prisma.$transaction(async (tx) => {
      const data: Prisma.CollectionUpdateInput = {};
      if (input.name !== undefined) data.name = input.name;
      if (slug !== undefined) data.slug = slug;
      if (input.description !== undefined) data.description = input.description ?? null;
      if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
      if (input.status !== undefined) data.status = input.status;
      if (input.position !== undefined) data.position = input.position;

      const updated =
        Object.keys(data).length > 0
          ? await tx.collection.update({ where: { id: collectionId }, data })
          : existing;

      if (input.productIds !== undefined) {
        const productIds = await ownedProductIds(tx, storeId, input.productIds);
        await tx.collectionProduct.deleteMany({ where: { collectionId } });
        if (productIds.length > 0) {
          await tx.collectionProduct.createMany({
            data: productIds.map((productId, index) => ({
              collectionId,
              productId,
              position: index,
            })),
            skipDuplicates: true,
          });
        }
      }

      return updated;
    });

    return toCollectionDto(collection, await collectionRepository.countProducts(collectionId));
  },

  async remove(storeId: string, collectionId: string): Promise<void> {
    const existing = await collectionRepository.findById(storeId, collectionId);
    if (!existing) throw ApiError.notFound('Collection not found', 'COLLECTION_NOT_FOUND');
    await collectionRepository.delete(collectionId);
  },

  async reorder(storeId: string, ids: string[]): Promise<void> {
    const owned = await prisma.collection.findMany({
      where: { id: { in: ids }, storeId },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((row) => row.id));

    await prisma.$transaction(
      ids
        .filter((id) => ownedIds.has(id))
        .map((id, index) => prisma.collection.update({ where: { id }, data: { position: index } })),
    );
  },
};
