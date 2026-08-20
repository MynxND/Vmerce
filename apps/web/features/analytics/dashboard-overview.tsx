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
import { formatDate } from '@/lib/utils';
import { StatCards } from './stat-cards';
import { SalesChart } from './sales-chart';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
] as const;

export function DashboardOverview() {
  const storeId = useActiveStoreId();
  const store = useActiveStoreSummary();
  const [days, setDays] = React.useState<number>(30);

  const { data, isPending, isError, error } = useQuery({
    queryKey: storeKeys.overview(storeId ?? 'none', days),
    queryFn: () => storesApi.overview(storeId!, days),
    enabled: Boolean(storeId),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={store ? `@${store.handle}` : undefined}
        title="Overview"
        description="How your shop is doing, at a glance."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/orders">
                <ShoppingBag /> Orders
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/products/new">
                <PackagePlus /> New product
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <Tabs value={String(days)} onValueChange={(value) => setDays(Number(value))}>
          <TabsList>
            {RANGES.map((range) => (
              <TabsTrigger key={range.value} value={String(range.value)}>
                {range.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {data && (
          <p className="text-muted-foreground hidden text-xs sm:block">
            {formatDate(data.range.from)} — {formatDate(data.range.to)}
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
            <CardTitle>Sales</CardTitle>
            <CardDescription>Revenue and order volume over the selected range.</CardDescription>
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
            <CardTitle>Top products</CardTitle>
            <CardDescription>Best sellers in this period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending &&
              [0, 1, 2].map((index) => <Skeleton key={index} className="h-12 w-full" />)}

            {!isPending && (data?.topProducts.length ?? 0) === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No sales yet in this period.
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
                  <span className="text-muted-foreground block text-xs">{product.orders} sold</span>
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
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>The last few orders across your shop.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/orders">
              View all <ArrowUpRight />
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
                title="No orders yet"
                description="Once someone checks out, their order will show up here."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/products">Add products</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead className="hidden lg:table-cell">Fulfillment</TableHead>
                  <TableHead className="hidden xl:table-cell">Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
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
                      {formatDate(order.createdAt)}
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
