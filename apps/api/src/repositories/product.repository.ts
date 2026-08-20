import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

/** Everything the product DTO mapper needs, in one round trip. */
export const productInclude = {
  media: { orderBy: { position: 'asc' } },
  options: {
    orderBy: { position: 'asc' },
    include: { values: { orderBy: { position: 'asc' } } },
  },
  variants: {
    orderBy: { position: 'asc' },
    include: {
      optionValues: { include: { optionValue: { include: { option: true } } } },
    },
  },
  collections: { select: { collectionId: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export const productListInclude = {
  media: { orderBy: { position: 'asc' }, take: 1 },
  variants: { select: { id: true, stock: true } },
} satisfies Prisma.ProductInclude;

export type ProductListRow = Prisma.ProductGetPayload<{ include: typeof productListInclude }>;

export const productRepository = {
  findById(storeId: string, productId: string): Promise<ProductWithRelations | null> {
    // storeId is part of the predicate so a leaked id from another tenant misses.
    return prisma.product.findFirst({ where: { id: productId, storeId }, include: productInclude });
  },

  findBySlug(storeId: string, slug: string): Promise<ProductWithRelations | null> {
    return prisma.product.findUnique({
      where: { storeId_slug: { storeId, slug } },
      include: productInclude,
    });
  },

  slugExists(storeId: string, slug: string): Promise<boolean> {
    return prisma.product
      .findUnique({ where: { storeId_slug: { storeId, slug } }, select: { id: true } })
      .then((row) => row !== null);
  },

  async list(params: {
    storeId: string;
    where: Prisma.ProductWhereInput;
    orderBy: Prisma.ProductOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<{ rows: ProductListRow[]; total: number }> {
    const where: Prisma.ProductWhereInput = { ...params.where, storeId: params.storeId };
    const [rows, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: productListInclude,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
      }),
      prisma.product.count({ where }),
    ]);
    return { rows, total };
  },

  create(data: Prisma.ProductCreateInput, tx?: Prisma.TransactionClient) {
    return (tx ?? prisma).product.create({ data, include: productInclude });
  },

  update(productId: string, data: Prisma.ProductUpdateInput, tx?: Prisma.TransactionClient) {
    return (tx ?? prisma).product.update({
      where: { id: productId },
      data,
      include: productInclude,
    });
  },

  delete(productId: string): Promise<{ id: string }> {
    return prisma.product.delete({ where: { id: productId }, select: { id: true } });
  },

  /** Minimal read used by the stock guard on every cart mutation. */
  findVariantStock(variantId: string) {
    return prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        stock: true,
        enabled: true,
        product: { select: { inventoryMode: true, status: true } },
      },
    });
  },

  findVariantForStore(storeId: string, variantId: string) {
    return prisma.productVariant.findFirst({
      where: { id: variantId, storeId },
      include: {
        product: { select: { id: true, title: true, slug: true, status: true, storeId: true } },
        optionValues: { include: { optionValue: true } },
      },
    });
  },
};
