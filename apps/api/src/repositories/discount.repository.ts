import type { Discount, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const discountRepository = {
  findByCode(storeId: string, code: string): Promise<Discount | null> {
    return prisma.discount.findUnique({ where: { storeId_code: { storeId, code } } });
  },

  findById(storeId: string, discountId: string): Promise<Discount | null> {
    return prisma.discount.findFirst({ where: { id: discountId, storeId } });
  },

  async list(params: {
    storeId: string;
    where: Prisma.DiscountWhereInput;
    skip: number;
    take: number;
  }): Promise<{ rows: Discount[]; total: number }> {
    const where: Prisma.DiscountWhereInput = { ...params.where, storeId: params.storeId };
    const [rows, total] = await prisma.$transaction([
      prisma.discount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.discount.count({ where }),
    ]);
    return { rows, total };
  },

  create(data: Prisma.DiscountUncheckedCreateInput): Promise<Discount> {
    return prisma.discount.create({ data });
  },

  update(discountId: string, data: Prisma.DiscountUpdateInput): Promise<Discount> {
    return prisma.discount.update({ where: { id: discountId }, data });
  },

  delete(discountId: string): Promise<{ id: string }> {
    return prisma.discount.delete({ where: { id: discountId }, select: { id: true } });
  },

  incrementUsage(id: string, tx?: Prisma.TransactionClient): Promise<Discount> {
    return (tx ?? prisma).discount.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  },
};
