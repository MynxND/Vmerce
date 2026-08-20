import type { CartDto, CartItemDto } from '@cc/types';
import type { CartWithRelations } from '../repositories/cart.repository';
import type { CartTotals } from '../services/pricing.service';

export function toCartDto(cart: CartWithRelations, totals: CartTotals): CartDto {
  const items: CartItemDto[] = cart.items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    productId: item.variant.product.id,
    productTitle: item.variant.product.title,
    productSlug: item.variant.product.slug,
    variantTitle: item.variant.title,
    imageUrl: item.variant.imageUrl,
    unitPrice: item.variant.price,
    quantity: item.quantity,
    lineTotal: item.variant.price * item.quantity,
    available: item.variant.enabled && item.variant.product.status === 'ACTIVE',
  }));

  return {
    id: cart.id,
    token: cart.token,
    storeId: cart.storeId,
    storeHandle: cart.store.handle,
    currency: cart.store.currency,
    items,
    discountCode: cart.discountCode,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    shippingTotal: totals.shippingTotal,
    total: totals.total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
