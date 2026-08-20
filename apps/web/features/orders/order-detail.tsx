'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@cc/shared';
import { FulfillmentStatus, OrderStatus, PaymentStatus } from '@cc/types';
import type { UpdateOrderInput } from '@cc/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Field } from '@/components/field';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import {
  FulfillmentStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/status-badge';
import { orderKeys, ordersApi } from '@/features/orders/api';
import { useActiveStoreId } from '@/hooks/use-active-store';
import { errorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/utils';
import { PaymentProofReview } from '@/features/payments/proof-review';

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const storeId = useActiveStoreId();
  const queryClient = useQueryClient();

  const { data: order, isPending } = useQuery({
    queryKey: orderKeys.detail(storeId ?? 'none', orderId),
    queryFn: () => ordersApi.get(storeId!, orderId),
    enabled: Boolean(storeId),
  });

  const update = useMutation({
    mutationFn: (input: UpdateOrderInput) => ordersApi.update(storeId!, orderId, input),
    onSuccess: (updated) => {
      toast.success('Order updated');
      queryClient.setQueryData(orderKeys.detail(storeId!, orderId), updated);
      void queryClient.invalidateQueries({ queryKey: orderKeys.all(storeId!) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">That order could not be found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Placed ${formatDateTime(order.createdAt)}`}
        title={order.orderNumber}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/orders">
              <ArrowLeft /> Orders
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
        <FulfillmentStatusBadge status={order.fulfillmentStatus} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="border-border bg-muted size-14 shrink-0 overflow-hidden rounded-lg border">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.productTitle}</p>
                    <p className="text-muted-foreground truncate text-sm">{item.variantTitle}</p>
                    {item.sku && (
                      <p className="text-muted-foreground truncate font-mono text-xs">{item.sku}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">
                      {formatMoney(item.lineTotal, { currency: order.currency })}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {item.quantity} × {formatMoney(item.unitPrice, { currency: order.currency })}
                    </p>
                  </div>
                </div>
              ))}

              <Separator />

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatMoney(order.subtotal, { currency: order.currency })}</dd>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Discount{' '}
                      {order.discountCode && (
                        <span className="font-mono">({order.discountCode})</span>
                      )}
                    </dt>
                    <dd className="text-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]">
                      −{formatMoney(order.discountTotal, { currency: order.currency })}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Shipping {order.shippingMethod && `· ${order.shippingMethod}`}
                  </dt>
                  <dd>{formatMoney(order.shippingTotal, { currency: order.currency })}</dd>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatMoney(order.total, { currency: order.currency })}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update this order</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Order status" htmlFor="order-status">
                <Select
                  value={order.status}
                  onValueChange={(value) => update.mutate({ status: value as OrderStatus })}
                >
                  <SelectTrigger id="order-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(OrderStatus).map((value) => (
                      <SelectItem key={value} value={value}>
                        {titleCase(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Payment" htmlFor="payment-status">
                <Select
                  value={order.paymentStatus}
                  onValueChange={(value) =>
                    update.mutate({ paymentStatus: value as PaymentStatus })
                  }
                >
                  <SelectTrigger id="payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PaymentStatus).map((value) => (
                      <SelectItem key={value} value={value}>
                        {titleCase(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Fulfillment" htmlFor="fulfillment-status">
                <Select
                  value={order.fulfillmentStatus}
                  onValueChange={(value) =>
                    update.mutate({ fulfillmentStatus: value as FulfillmentStatus })
                  }
                >
                  <SelectTrigger id="fulfillment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FulfillmentStatus).map((value) => (
                      <SelectItem key={value} value={value}>
                        {titleCase(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Tracking number" htmlFor="tracking">
                <div className="flex gap-2">
                  <Input
                    id="tracking"
                    defaultValue={order.trackingNumber ?? ''}
                    placeholder="TH900000123"
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value !== (order.trackingNumber ?? '')) {
                        update.mutate({ trackingNumber: value || null });
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="icon" aria-label="Tracking">
                    <Truck />
                  </Button>
                </div>
              </Field>
            </CardContent>
          </Card>

          <PaymentProofReview order={order} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted-foreground">{order.email}</p>
              {order.phone && <p className="text-muted-foreground">{order.phone}</p>}
              {order.customer && (
                <Button asChild variant="link" size="sm" className="h-auto px-0">
                  <Link href={`/dashboard/customers/${order.customer.id}`}>View customer</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-0.5 text-sm">
              {order.shippingAddress ? (
                <>
                  <p className="text-foreground font-medium">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>
                    {[order.shippingAddress.district, order.shippingAddress.province]
                      .filter(Boolean)
                      .join(', ')}{' '}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
                </>
              ) : (
                <p>No shipping address on this order.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Package className="text-muted-foreground size-4" />
                <span className="font-medium">{order.paymentProvider}</span>
              </p>
              {order.paymentReference && (
                <p className="text-muted-foreground font-mono text-xs">{order.paymentReference}</p>
              )}
              <p className="text-muted-foreground pt-2 text-xs">
                Phase 1 ships manual confirmation only — real providers plug into the same
                abstraction.
              </p>
            </CardContent>
          </Card>

          {order.note && (
            <Card>
              <CardHeader>
                <CardTitle>Customer note</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">{order.note}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
