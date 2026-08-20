'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { formatMoney } from '@cc/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/status-badge';
import { customerKeys, customersApi } from '@/features/customers/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { formatDate } from '@/lib/utils';

export function CustomerDetail({ customerId }: { customerId: string }) {
  const storeId = useActiveStoreId();

  const { data: customer, isPending } = useQuery({
    queryKey: customerKeys.detail(storeId ?? 'none', customerId),
    queryFn: () => customersApi.get(storeId!, customerId),
    enabled: Boolean(storeId),
  });

  if (isPending) return <Skeleton className="h-64 w-full" />;

  if (!customer) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">That customer could not be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/customers">Back to customers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer"
        title={customer.name ?? customer.email}
        description={customer.email}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/customers">
              <ArrowLeft /> Customers
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Order history</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {customer.orders.length === 0 ? (
              <p className="text-muted-foreground px-5 pb-5 text-sm">No orders yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="text-primary font-mono text-xs font-semibold hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatMoney(order.total, { currency: order.currency })}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Orders</dt>
                  <dd className="font-medium">{customer.ordersCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total spent</dt>
                  <dd className="font-medium">{formatMoney(customer.totalSpent)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{customer.phone ?? '—'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Customer since</dt>
                  <dd>{formatDate(customer.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {customer.addresses.length === 0 && (
                <p className="text-muted-foreground">No saved addresses.</p>
              )}
              {customer.addresses.map((address) => (
                <div key={address.id} className="text-muted-foreground space-y-0.5">
                  <p className="text-foreground font-medium">
                    {address.firstName} {address.lastName}
                  </p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {[address.district, address.province].filter(Boolean).join(', ')}{' '}
                    {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {customer.note && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">{customer.note}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
