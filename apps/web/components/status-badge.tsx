import type { FulfillmentStatus, OrderStatus, PaymentStatus, ProductStatus } from '@cc/types';
import { Badge, type BadgeProps } from '@/components/ui/badge';

type Variant = NonNullable<BadgeProps['variant']>;

const ORDER: Record<OrderStatus, { label: string; variant: Variant }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'default' },
  PROCESSING: { label: 'Processing', variant: 'default' },
  FULFILLED: { label: 'Fulfilled', variant: 'success' },
  SHIPPED: { label: 'Shipped', variant: 'success' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'neutral' },
  REFUNDED: { label: 'Refunded', variant: 'destructive' },
};

const PAYMENT: Record<PaymentStatus, { label: string; variant: Variant }> = {
  PENDING: { label: 'Unpaid', variant: 'warning' },
  PAID: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'destructive' },
  REFUNDED: { label: 'Refunded', variant: 'neutral' },
  PARTIALLY_REFUNDED: { label: 'Part refunded', variant: 'neutral' },
};

const FULFILLMENT: Record<FulfillmentStatus, { label: string; variant: Variant }> = {
  UNFULFILLED: { label: 'Unfulfilled', variant: 'neutral' },
  PROCESSING: { label: 'Processing', variant: 'warning' },
  FULFILLED: { label: 'Fulfilled', variant: 'success' },
  SHIPPED: { label: 'Shipped', variant: 'success' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
};

const PRODUCT: Record<ProductStatus, { label: string; variant: Variant }> = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  ACTIVE: { label: 'Active', variant: 'success' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const entry = ORDER[status];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const entry = PAYMENT[status];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const entry = FULFILLMENT[status];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const entry = PRODUCT[status];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
