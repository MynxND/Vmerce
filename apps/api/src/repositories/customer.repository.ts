import type { Customer, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const customerRepository = {
  findById(storeId: string, customerId: string) {
    return prisma.customer.findFirst({
      where: { id: customerId, storeId },
      include: {
        addresses: true,
        orders: { orderBy: { createdAt: 'desc' }, take: 20, include: { items: true } },
      },
    });
  },

  findByEmail(storeId: string, email: string): Promise<Customer | null> {
    return prisma.customer.findUnique({ where: { storeId_email: { storeId, email } } });
  },

  async list(params: {
    storeId: string;
    where: Prisma.CustomerWhereInput;
    skip: number;
    take: number;
  }) {
    const where: Prisma.CustomerWhereInput = { ...params.where, storeId: params.storeId };
    const [rows, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.customer.count({ where }),
    ]);
    return { rows, total };
  },

  /** Called during checkout — creates the customer record on first purchase. */
  upsertForCheckout(
    input: { storeId: string; email: string; name: string; phone: string | null },
    tx?: Prisma.TransactionClient,
  ): Promise<Customer> {
    const client = tx ?? prisma;
    return client.customer.upsert({
      where: { storeId_email: { storeId: input.storeId, email: input.email } },
      create: {
        storeId: input.storeId,
        email: input.email,
        name: input.name,
        phone: input.phone,
      },
      update: { name: input.name, phone: input.phone ?? undefined },
    });
  },

  recordOrder(
    customerId: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Customer> {
    return (tx ?? prisma).customer.update({
      where: { id: customerId },
      data: {
        ordersCount: { increment: 1 },
        totalSpent: { increment: amount },
        lastOrderAt: new Date(),
      },
    });
  },

  update(customerId: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return prisma.customer.update({ where: { id: customerId }, data });
  },
};
