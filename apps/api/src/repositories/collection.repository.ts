import type { Collection, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const collectionRepository = {
  findById(storeId: string, collectionId: string) {
    return prisma.collection.findFirst({
      where: { id: collectionId, storeId },
      include: {
        products: { select: { productId: true, position: true }, orderBy: { position: 'asc' } },
      },
    });
  },

  findBySlug(storeId: string, slug: string) {
    return prisma.collection.findUnique({
      where: { storeId_slug: { storeId, slug } },
      include: {
        products: { select: { productId: true, position: true }, orderBy: { position: 'asc' } },
      },
    });
  },

  slugExists(storeId: string, slug: string): Promise<boolean> {
    return prisma.collection
      .findUnique({ where: { storeId_slug: { storeId, slug } }, select: { id: true } })
      .then((row) => row !== null);
  },

  async list(params: {
    storeId: string;
    where?: Prisma.CollectionWhereInput;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.CollectionWhereInput = { ...params.where, storeId: params.storeId };
    const [rows, total] = await prisma.$transaction([
      prisma.collection.findMany({
        where,
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        include: { _count: { select: { products: true } } },
        ...(params.skip !== undefined ? { skip: params.skip } : {}),
        ...(params.take !== undefined ? { take: params.take } : {}),
      }),
      prisma.collection.count({ where }),
    ]);
    return { rows, total };
  },

  create(data: Prisma.CollectionCreateInput): Promise<Collection> {
    return prisma.collection.create({ data });
  },

  update(collectionId: string, data: Prisma.CollectionUpdateInput): Promise<Collection> {
    return prisma.collection.update({ where: { id: collectionId }, data });
  },

  delete(collectionId: string): Promise<{ id: string }> {
    return prisma.collection.delete({ where: { id: collectionId }, select: { id: true } });
  },

  async replaceProducts(collectionId: string, productIds: string[]): Promise<void> {
    await prisma.$transaction([
      prisma.collectionProduct.deleteMany({ where: { collectionId } }),
      prisma.collectionProduct.createMany({
        data: productIds.map((productId, index) => ({ collectionId, productId, position: index })),
        skipDuplicates: true,
      }),
    ]);
  },

  countProducts(collectionId: string): Promise<number> {
    return prisma.collectionProduct.count({ where: { collectionId } });
  },
};
