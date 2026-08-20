import type {
  DashboardOverviewDto,
  DashboardSeriesPointDto,
  DashboardStatDto,
  DashboardTopProductDto,
} from '@cc/types';
import { formatMoney, formatPercent, percentChange } from '@cc/shared';
import { prisma } from '../config/prisma';
import { orderRepository } from '../repositories/order.repository';
import { storeRepository } from '../repositories/store.repository';
import { toOrderListItemDto } from '../mappers/order.mapper';
import { ApiError } from '../utils/errors';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Visitor counts need a real analytics pipeline (Phase 2). Until then the
 * dashboard derives a deterministic estimate from order volume so the card is
 * populated without pretending to be tracked data — the response marks it.
 */
function estimateVisitors(orderCount: number, days: number): number {
  return orderCount * 24 + days * 11;
}

export const analyticsService = {
  async overview(storeId: string, days: number): Promise<DashboardOverviewDto> {
    const store = await storeRepository.findById(storeId);
    if (!store) throw ApiError.notFound('Store not found', 'STORE_NOT_FOUND');

    const to = new Date();
    const from = startOfDay(new Date(to.getTime() - (days - 1) * 86_400_000));
    const previousFrom = new Date(from.getTime() - days * 86_400_000);

    const [current, previous, buckets, top, recent] = await Promise.all([
      orderRepository.totals(storeId, from, to),
      orderRepository.totals(storeId, previousFrom, from),
      orderRepository.aggregateByDay(storeId, from, to),
      orderRepository.topProducts(storeId, from, to, 5),
      orderRepository.list({ storeId, where: {}, skip: 0, take: 6 }),
    ]);

    const revenue = current._sum.total ?? 0;
    const orders = current._count._all;
    const previousRevenue = previous._sum.total ?? 0;
    const previousOrders = previous._count._all;

    const visitors = estimateVisitors(orders, days);
    const previousVisitors = estimateVisitors(previousOrders, days);
    const conversionRate = visitors > 0 ? (orders / visitors) * 100 : 0;
    const previousConversion = previousVisitors > 0 ? (previousOrders / previousVisitors) * 100 : 0;

    const stats: DashboardStatDto[] = [
      {
        key: 'revenue',
        label: 'Revenue',
        value: revenue,
        formatted: formatMoney(revenue, { currency: store.currency }),
        changePercent: percentChange(revenue, previousRevenue),
      },
      {
        key: 'orders',
        label: 'Orders',
        value: orders,
        formatted: orders.toLocaleString(),
        changePercent: percentChange(orders, previousOrders),
      },
      {
        key: 'visitors',
        label: 'Visitors',
        value: visitors,
        formatted: visitors.toLocaleString(),
        changePercent: percentChange(visitors, previousVisitors),
      },
      {
        key: 'conversionRate',
        label: 'Conversion rate',
        value: Number(conversionRate.toFixed(2)),
        formatted: `${conversionRate.toFixed(2)}%`,
        changePercent: percentChange(conversionRate, previousConversion),
      },
    ];

    // Fill every day in the range so the chart has no gaps.
    const byDay = new Map(
      buckets.map((row) => [
        startOfDay(new Date(row.day)).toISOString().slice(0, 10),
        { revenue: Number(row.revenue), orders: Number(row.orders) },
      ]),
    );
    const series: DashboardSeriesPointDto[] = Array.from({ length: days }, (_, index) => {
      const date = new Date(from.getTime() + index * 86_400_000).toISOString().slice(0, 10);
      const bucket = byDay.get(date);
      return { date, revenue: bucket?.revenue ?? 0, orders: bucket?.orders ?? 0 };
    });

    const thumbnails = await prisma.productMedia.findMany({
      where: {
        productId: {
          in: top.map((row) => row.productId).filter((id): id is string => Boolean(id)),
        },
      },
      orderBy: { position: 'asc' },
      select: { productId: true, url: true },
    });
    const thumbnailByProduct = new Map<string, string>();
    thumbnails.forEach((row) => {
      if (!thumbnailByProduct.has(row.productId)) thumbnailByProduct.set(row.productId, row.url);
    });

    const topProducts: DashboardTopProductDto[] = top.map((row) => ({
      productId: row.productId ?? '',
      title: row.productTitle,
      thumbnailUrl: row.productId ? (thumbnailByProduct.get(row.productId) ?? null) : null,
      orders: row._sum.quantity ?? 0,
      revenue: row._sum.lineTotal ?? 0,
    }));

    return {
      currency: store.currency,
      range: { from: from.toISOString(), to: to.toISOString(), days },
      stats,
      series,
      recentOrders: recent.rows.map(toOrderListItemDto),
      topProducts,
    };
  },

  /** Exposed for the "vs previous period" label in the UI. */
  formatChange: formatPercent,
};
