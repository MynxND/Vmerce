'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, PackagePlus, ShoppingBag, TriangleAlert } from 'lucide-react';
import { formatMoney } from '@cc/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import {
  FulfillmentStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/status-badge';
import { storeKeys, storesApi } from '@/features/stores/api';
import { useActiveStoreId, useActiveStoreSummary } from '@/hooks/use-active-store';
import { StatCards } from './stat-cards';
import { SalesChart } from './sales-chart';
import { useLocale } from '@/lib/i18n';

const RANGES = [7, 30, 90] as const;

export function DashboardOverview() {
  const storeId = useActiveStoreId();
  const store = useActiveStoreSummary();
  const [days, setDays] = React.useState<number>(30);
  const { locale, t } = useLocale();
  const dateLocale = locale === 'th' ? 'th-TH' : locale === 'ja' ? 'ja-JP' : 'en-GB';
  const localDate = (value: string | Date) => new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

  const { data, isPending, isError, error } = useQuery({
    queryKey: storeKeys.overview(storeId ?? 'none', days),
    queryFn: () => storesApi.overview(storeId!, days),
    enabled: Boolean(storeId),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={store ? `@${store.handle}` : undefined}
        title={t('overview')}
        description={t('overviewDescription')}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/orders">
                <ShoppingBag /> {t('orders')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/products/new">
                <PackagePlus /> {t('newProduct')}
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <Tabs value={String(days)} onValueChange={(value) => setDays(Number(value))}>
          <TabsList>
            {RANGES.map((range) => (
              <TabsTrigger key={range} value={String(range)}>
                {range} {t('days')}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {data && (
          <p className="text-muted-foreground hidden text-xs sm:block">
            {localDate(data.range.from)} — {localDate(data.range.to)}
          </p>
        )}
      </div>

      {isError && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-3 p-5 text-sm">
            <TriangleAlert className="text-destructive size-4" />
            <span>{error instanceof Error ? error.message : 'Could not load your dashboard.'}</span>
          </CardContent>
        </Card>
      )}

      <StatCards stats={data?.stats ?? []} loading={isPending} />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('sales')}</CardTitle>
            <CardDescription>{t('salesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <SalesChart series={data?.series ?? []} currency={data?.currency ?? 'THB'} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('topProducts')}</CardTitle>
            <CardDescription>{t('topProductsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending &&
              [0, 1, 2].map((index) => <Skeleton key={index} className="h-12 w-full" />)}

            {!isPending && (data?.topProducts.length ?? 0) === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {t('noSales')}
              </p>
            )}

            {data?.topProducts.map((product) => (
              <div
                key={`${product.productId}-${product.title}`}
                className="flex items-center gap-3"
              >
                <span className="border-border bg-muted size-10 shrink-0 overflow-hidden rounded-lg border">
                  {product.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.thumbnailUrl} alt="" className="size-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{product.title}</span>
                  <span className="text-muted-foreground block text-xs">{product.orders} {t('sold')}</span>
                </span>
                <span className="shrink-0 text-sm font-medium">
                  {formatMoney(product.revenue, { currency: data.currency })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{t('recentOrders')}</CardTitle>
            <CardDescription>{t('recentOrdersDescription')}</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/orders">
              {t('viewAll')} <ArrowUpRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {isPending ? (
            <div className="space-y-2 px-5 pb-5">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : (data?.recentOrders.length ?? 0) === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={ShoppingBag}
                title={t('noOrders')}
                description={t('noOrdersDescription')}
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/products">{t('addProducts')}</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('order')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('items')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('payment')}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('fulfillment')}</TableHead>
                  <TableHead className="hidden xl:table-cell">{t('status')}</TableHead>
                  <TableHead className="text-right">{t('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-primary font-mono text-xs font-semibold hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-40 truncate">{order.customerName}</TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-48 truncate md:table-cell">
                      {order.itemSummary}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatMoney(order.total, { currency: order.currency })}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-right">
                      {localDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
