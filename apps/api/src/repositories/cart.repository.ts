import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const cartInclude = {
  store: { select: { id: true, handle: true, currency: true } },
  items: {
    orderBy: { createdAt: 'asc' },
    include: {
      variant: {
        include: {
          product: {
            select: { id: true, title: true, slug: true, status: true },
          },
          optionValues: { include: { optionValue: true } },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithRelations = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export const cartRepository = {
  findByToken(token: string): Promise<CartWithRelations | null> {
    return prisma.cart.findUnique({ where: { token }, include: cartInclude });
  },

  create(data: Prisma.CartCreateInput): Promise<CartWithRelations> {
    return prisma.cart.create({ data, include: cartInclude });
  },

  update(cartId: string, data: Prisma.CartUpdateInput): Promise<CartWithRelations> {
    return prisma.cart.update({ where: { id: cartId }, data, include: cartInclude });
  },

  upsertItem(cartId: string, variantId: string, quantity: number) {
    return prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId } },
      create: { cartId, variantId, quantity },
      update: { quantity: { increment: quantity } },
    });
  },

  setItemQuantity(itemId: string, quantity: number) {
    return prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  },

  findItem(cartId: string, itemId: string) {
    return prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
  },

  deleteItem(itemId: string) {
    return prisma.cartItem.delete({ where: { id: itemId }, select: { id: true } });
  },

  clearItems(cartId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? prisma).cartItem.deleteMany({ where: { cartId } });
  },
};
