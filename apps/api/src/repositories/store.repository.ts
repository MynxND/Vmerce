import type { Prisma, Store, StoreMember, StoreTheme } from '@prisma/client';
import { prisma } from '../config/prisma';

export const storeRepository = {
  findById(id: string): Promise<Store | null> {
    return prisma.store.findUnique({ where: { id } });
  },

  findByHandle(handle: string): Promise<Store | null> {
    return prisma.store.findUnique({ where: { handle } });
  },

  handleExists(handle: string): Promise<boolean> {
    return prisma.store
      .findUnique({ where: { handle }, select: { id: true } })
      .then((row) => row !== null);
  },

  findMembership(userId: string, storeId: string): Promise<StoreMember | null> {
    return prisma.storeMember.findUnique({ where: { storeId_userId: { storeId, userId } } });
  },

  listForUser(userId: string) {
    return prisma.storeMember.findMany({
      where: { userId },
      include: { store: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  create(data: Prisma.StoreCreateInput): Promise<Store> {
    return prisma.store.create({ data });
  },

  update(id: string, data: Prisma.StoreUpdateInput): Promise<Store> {
    return prisma.store.update({ where: { id }, data });
  },

  findTheme(storeId: string): Promise<StoreTheme | null> {
    return prisma.storeTheme.findUnique({ where: { storeId } });
  },

  upsertTheme(storeId: string, data: Prisma.StoreThemeUncheckedCreateInput): Promise<StoreTheme> {
    const { storeId: _ignored, ...update } = data;
    return prisma.storeTheme.upsert({
      where: { storeId },
      create: data,
      update,
    });
  },

  findPages(storeId: string) {
    return prisma.storePage.findMany({
      where: { storeId },
      include: { sections: { orderBy: { position: 'asc' } } },
      orderBy: [{ isHome: 'desc' }, { slug: 'asc' }],
    });
  },

  findPageBySlug(storeId: string, slug: string) {
    return prisma.storePage.findUnique({
      where: { storeId_slug: { storeId, slug } },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  },

  findPageById(storeId: string, pageId: string) {
    return prisma.storePage.findFirst({
      where: { id: pageId, storeId },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  },

  findHomePage(storeId: string) {
    return prisma.storePage.findFirst({
      where: { storeId, isHome: true },
      include: { sections: { orderBy: { position: 'asc' } } },
    });
  },

  /**
   * Atomically increments the per-store order counter and returns the new value,
   * so two concurrent checkouts can never mint the same order number.
   */
  async nextOrderSequence(storeId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? prisma;
    const store = await client.store.update({
      where: { id: storeId },
      data: { orderSequence: { increment: 1 } },
      select: { orderSequence: true },
    });
    return store.orderSequence;
  },
};
