'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag } from 'lucide-react';
import { formatMoney } from '@cc/shared';
import { OrderStatus, PaymentStatus } from '@cc/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import {
  FulfillmentStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/status-badge';
import { orderKeys, ordersApi } from '@/features/orders/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatDate } from '@/lib/utils';

const ALL = 'all';

export function OrderList() {
  const storeId = useActiveStoreId();
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<string>(ALL);
  const [payment, setPayment] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);

  const debouncedSearch = useDebouncedValue(search);

  const query = {
    page,
    perPage: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== ALL ? { status: status as OrderStatus } : {}),
    ...(payment !== ALL ? { paymentStatus: payment as PaymentStatus } : {}),
  };

  const { data, isPending } = useQuery({
    queryKey: orderKeys.list(storeId ?? 'none', query),
    queryFn: () => ordersApi.list(storeId!, query),
    enabled: Boolean(storeId),
  });

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Every order placed through your storefront." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Order number, name or email"
            className="pl-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.values(OrderStatus).map((value) => (
              <SelectItem key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={payment}
          onValueChange={(value) => {
            setPayment(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All payments</SelectItem>
            {Object.values(PaymentStatus).map((value) => (
              <SelectItem key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="px-0 pb-0 pt-0">
          {isPending ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={ShoppingBag}
                title="No orders here"
                description="When a customer checks out, their order appears in this list."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="hidden md:table-cell">Fulfillment</TableHead>
                  <TableHead className="hidden xl:table-cell">Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-primary font-mono text-xs font-semibold hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-40 truncate font-medium">
                        {order.customerName}
                      </span>
                      <span className="text-muted-foreground block max-w-40 truncate text-xs">
                        {order.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden max-w-52 truncate lg:table-cell">
                      {order.itemSummary}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatMoney(order.total, { currency: order.currency })}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
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

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {meta.page} of {meta.totalPages} · {meta.total} orders
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
