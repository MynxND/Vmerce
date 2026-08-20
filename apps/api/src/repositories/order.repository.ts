import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const orderInclude = {
  items: { orderBy: { createdAt: 'asc' } },
  addresses: true,
  customer: { select: { id: true, email: true, name: true } },
} satisfies Prisma.OrderInclude;

export type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export const orderListInclude = {
  items: { select: { productTitle: true, quantity: true } },
} satisfies Prisma.OrderInclude;

export type OrderListRow = Prisma.OrderGetPayload<{ include: typeof orderListInclude }>;

export const orderRepository = {
  findById(storeId: string, orderId: string): Promise<OrderWithRelations | null> {
    return prisma.order.findFirst({ where: { id: orderId, storeId }, include: orderInclude });
  },

  findByNumber(storeId: string, orderNumber: string): Promise<OrderWithRelations | null> {
    return prisma.order.findUnique({
      where: { storeId_orderNumber: { storeId, orderNumber } },
      include: orderInclude,
    });
  },

  async list(params: {
    storeId: string;
    where: Prisma.OrderWhereInput;
    skip: number;
    take: number;
  }): Promise<{ rows: OrderListRow[]; total: number }> {
    const where: Prisma.OrderWhereInput = { ...params.where, storeId: params.storeId };
    const [rows, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: orderListInclude,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.order.count({ where }),
    ]);
    return { rows, total };
  },

  create(
    data: Prisma.OrderCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<OrderWithRelations> {
    return (tx ?? prisma).order.create({ data, include: orderInclude });
  },

  update(orderId: string, data: Prisma.OrderUpdateInput): Promise<OrderWithRelations> {
    return prisma.order.update({ where: { id: orderId }, data, include: orderInclude });
  },

  /** Revenue + order counts bucketed by day, used by the dashboard chart. */
  aggregateByDay(storeId: string, from: Date, to: Date) {
    return prisma.$queryRaw<Array<{ day: Date; revenue: bigint; orders: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day,
             COALESCE(SUM("total"), 0)      AS revenue,
             COUNT(*)                       AS orders
      FROM "orders"
      WHERE "storeId" = ${storeId}
        AND "createdAt" >= ${from}
        AND "createdAt" < ${to}
        AND "status" NOT IN ('CANCELLED', 'REFUNDED')
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  },

  totals(storeId: string, from: Date, to: Date) {
    return prisma.order.aggregate({
      where: {
        storeId,
        createdAt: { gte: from, lt: to },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      _sum: { total: true },
      _count: { _all: true },
    });
  },

  topProducts(storeId: string, from: Date, to: Date, limit: number) {
    return prisma.orderItem.groupBy({
      by: ['productId', 'productTitle'],
      where: {
        order: {
          storeId,
          createdAt: { gte: from, lt: to },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
      },
      _sum: { lineTotal: true, quantity: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: limit,
    });
  },
};
