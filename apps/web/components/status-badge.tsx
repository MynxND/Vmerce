'use client';

import type { FulfillmentStatus, OrderStatus, PaymentStatus, ProductStatus } from '@cc/types';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { useLocale, type Locale } from '@/lib/i18n';

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

const STATUS_COPY: Record<Locale, Record<string, string>> = {
  en: {},
  th: { Pending: 'รอดำเนินการ', Confirmed: 'ยืนยันแล้ว', Processing: 'กำลังดำเนินการ', Fulfilled: 'จัดเตรียมแล้ว', Shipped: 'จัดส่งแล้ว', Delivered: 'ส่งถึงแล้ว', Cancelled: 'ยกเลิก', Refunded: 'คืนเงินแล้ว', Unpaid: 'ยังไม่ชำระ', Paid: 'ชำระแล้ว', Failed: 'ไม่สำเร็จ', 'Part refunded': 'คืนเงินบางส่วน', Unfulfilled: 'ยังไม่จัดเตรียม', Draft: 'ฉบับร่าง', Active: 'ใช้งานอยู่', Archived: 'เก็บถาวร' },
  ja: { Pending: '保留中', Confirmed: '確認済み', Processing: '処理中', Fulfilled: '発送準備済み', Shipped: '発送済み', Delivered: '配達済み', Cancelled: 'キャンセル', Refunded: '返金済み', Unpaid: '未払い', Paid: '支払い済み', Failed: '失敗', 'Part refunded': '一部返金', Unfulfilled: '未発送', Draft: '下書き', Active: '公開中', Archived: 'アーカイブ' },
};

function LocalizedBadge({ entry }: { entry: { label: string; variant: Variant } }) {
  const { locale } = useLocale();
  return <Badge variant={entry.variant}>{STATUS_COPY[locale][entry.label] ?? entry.label}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const entry = ORDER[status];
  return <LocalizedBadge entry={entry} />;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const entry = PAYMENT[status];
  return <LocalizedBadge entry={entry} />;
}

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const entry = FULFILLMENT[status];
  return <LocalizedBadge entry={entry} />;
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const entry = PRODUCT[status];
  return <LocalizedBadge entry={entry} />;
}
