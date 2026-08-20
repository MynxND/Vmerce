import type {
  AddressDto,
  FulfillmentStatus,
  OrderDto,
  OrderListItemDto,
  OrderStatus,
  PaymentStatus,
} from '@cc/types';
import type { OrderAddress } from '@prisma/client';
import type { OrderListRow, OrderWithRelations } from '../repositories/order.repository';

function toAddressDto(address: OrderAddress): AddressDto {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    district: address.district,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
  };
}

export function toOrderDto(order: OrderWithRelations): OrderDto {
  const shipping = order.addresses.find((address) => address.kind === 'SHIPPING');
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    storeId: order.storeId,
    status: order.status as OrderStatus,
    paymentStatus: order.paymentStatus as PaymentStatus,
    fulfillmentStatus: order.fulfillmentStatus as FulfillmentStatus,
    currency: order.currency,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shippingTotal: order.shippingTotal,
    taxTotal: order.taxTotal,
    total: order.total,
    discountCode: order.discountCode,
    email: order.email,
    phone: order.phone,
    customerName: order.customerName,
    note: order.note,
    paymentProvider: order.paymentProvider,
    paymentReference: order.paymentReference,
    shippingMethod: order.shippingMethod,
    trackingNumber: order.trackingNumber,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productTitle: item.productTitle,
      variantTitle: item.variantTitle,
      sku: item.sku,
      imageUrl: item.imageUrl,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    shippingAddress: shipping ? toAddressDto(shipping) : null,
    customer: order.customer ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function toOrderListItemDto(order: OrderListRow): OrderListItemDto {
  const first = order.items[0];
  const extra = order.items.length - 1;
  const itemSummary = first
    ? extra > 0
      ? `${first.productTitle} +${extra} more`
      : first.productTitle
    : '—';

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    itemSummary,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    total: order.total,
    currency: order.currency,
    status: order.status as OrderStatus,
    paymentStatus: order.paymentStatus as PaymentStatus,
    fulfillmentStatus: order.fulfillmentStatus as FulfillmentStatus,
    createdAt: order.createdAt.toISOString(),
  };
}
