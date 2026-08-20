import type { Prisma } from '@prisma/client';
import type { DiscountDto, Paginated } from '@cc/types';
import type { CreateDiscountInput, PaginationQuery, UpdateDiscountInput } from '@cc/shared';
import { prisma } from '../config/prisma';
import { discountRepository } from '../repositories/discount.repository';
import { toDiscountDto } from '../mappers/discount.mapper';
import { ApiError } from '../utils/errors';
import { paginated } from '../utils/response';

/**
 * Filters out ids from other tenants. A discount scoped to "products" must never
 * be able to reference another store's catalogue, even if the client sends it.
 */
async function ownedIds(
  storeId: string,
  productIds: string[],
  collectionIds: string[],
): Promise<{ productIds: string[]; collectionIds: string[] }> {
  const [products, collections] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds }, storeId },
          select: { id: true },
        })
      : Promise.resolve([]),
    collectionIds.length > 0
      ? prisma.collection.findMany({
          where: { id: { in: collectionIds }, storeId },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  return {
    productIds: products.map((row) => row.id),
    collectionIds: collections.map((row) => row.id),
  };
}

export const discountService = {
  async list(storeId: string, query: PaginationQuery): Promise<Paginated<DiscountDto>> {
    const where: Prisma.DiscountWhereInput = {};
    if (query.search) where.code = { contains: query.search.toUpperCase(), mode: 'insensitive' };

    const { rows, total } = await discountRepository.list({
      storeId,
      where,
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    });

    return paginated(rows.map(toDiscountDto), query.page, query.perPage, total);
  },

  async getById(storeId: string, discountId: string): Promise<DiscountDto> {
    const discount = await discountRepository.findById(storeId, discountId);
    if (!discount) throw ApiError.notFound('Discount not found');
    return toDiscountDto(discount);
  },

  async create(storeId: string, input: CreateDiscountInput): Promise<DiscountDto> {
    const existing = await discountRepository.findByCode(storeId, input.code);
    if (existing) throw ApiError.conflict('That code is already in use', 'CONFLICT');

    const scoped = await ownedIds(storeId, input.productIds, input.collectionIds);

    const discount = await discountRepository.create({
      storeId,
      code: input.code,
      type: input.type,
      value: input.value,
      minimumSpend: input.minimumSpend,
      usageLimit: input.usageLimit,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      active: input.active,
      productIds: scoped.productIds,
      collectionIds: scoped.collectionIds,
    });

    return toDiscountDto(discount);
  },

  async update(
    storeId: string,
    discountId: string,
    input: UpdateDiscountInput,
  ): Promise<DiscountDto> {
    const existing = await discountRepository.findById(storeId, discountId);
    if (!existing) throw ApiError.notFound('Discount not found');

    if (input.code && input.code !== existing.code) {
      const clash = await discountRepository.findByCode(storeId, input.code);
      if (clash) throw ApiError.conflict('That code is already in use', 'CONFLICT');
    }

    const data: Prisma.DiscountUpdateInput = {};
    if (input.code !== undefined) data.code = input.code;
    if (input.type !== undefined) data.type = input.type;
    if (input.value !== undefined) data.value = input.value;
    if (input.minimumSpend !== undefined) data.minimumSpend = input.minimumSpend;
    if (input.usageLimit !== undefined) data.usageLimit = input.usageLimit;
    if (input.active !== undefined) data.active = input.active;
    if (input.startsAt !== undefined)
      data.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.endsAt !== undefined) data.endsAt = input.endsAt ? new Date(input.endsAt) : null;

    if (input.productIds !== undefined || input.collectionIds !== undefined) {
      const scoped = await ownedIds(
        storeId,
        input.productIds ?? existing.productIds,
        input.collectionIds ?? existing.collectionIds,
      );
      data.productIds = scoped.productIds;
      data.collectionIds = scoped.collectionIds;
    }

    const discount = await discountRepository.update(discountId, data);
    return toDiscountDto(discount);
  },

  async remove(storeId: string, discountId: string): Promise<void> {
    const existing = await discountRepository.findById(storeId, discountId);
    if (!existing) throw ApiError.notFound('Discount not found');
    // Orders keep `discountCode` as plain text, so deleting a code is safe.
    await discountRepository.delete(discountId);
  },
};
