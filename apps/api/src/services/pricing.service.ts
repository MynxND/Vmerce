import type { Discount } from '@prisma/client';
import { DiscountType } from '@cc/types';
import { findShippingOption } from '@cc/shared';
import type { CartWithRelations } from '../repositories/cart.repository';
import { discountRepository } from '../repositories/discount.repository';
import { ApiError } from '../utils/errors';

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  discount: Discount | null;
}

export interface PriceCartOptions {
  /** Shipping option id; omitted while the visitor is still on the cart page. */
  shippingOptionId?: string | null;
}

function subtotalOf(cart: CartWithRelations): number {
  return cart.items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
}

/** Amount within the cart the discount is allowed to apply to. */
function eligibleSubtotal(cart: CartWithRelations, discount: Discount): number {
  const hasProductScope = discount.productIds.length > 0;
  const hasCollectionScope = discount.collectionIds.length > 0;
  if (!hasProductScope && !hasCollectionScope) return subtotalOf(cart);

  return cart.items.reduce((sum, item) => {
    const productId = item.variant.product.id;
    if (hasProductScope && discount.productIds.includes(productId)) {
      return sum + item.variant.price * item.quantity;
    }
    return sum;
  }, 0);
}

function assertUsable(discount: Discount, subtotal: number): void {
  const now = Date.now();
  if (!discount.active)
    throw ApiError.badRequest('That discount code is no longer active', 'DISCOUNT_INVALID');
  if (discount.startsAt && discount.startsAt.getTime() > now) {
    throw ApiError.badRequest('That discount code is not active yet', 'DISCOUNT_INVALID');
  }
  if (discount.endsAt && discount.endsAt.getTime() < now) {
    throw ApiError.badRequest('That discount code has expired', 'DISCOUNT_INVALID');
  }
  if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) {
    throw ApiError.badRequest('That discount code has reached its usage limit', 'DISCOUNT_INVALID');
  }
  if (discount.minimumSpend !== null && subtotal < discount.minimumSpend) {
    throw ApiError.badRequest(
      'Your cart does not meet the minimum spend for that code',
      'DISCOUNT_INVALID',
    );
  }
}

/**
 * Single source of truth for cart maths. The storefront never sends prices — it
 * only sends variant ids and quantities, and this recomputes everything.
 */
export async function priceCart(
  cart: CartWithRelations,
  options: PriceCartOptions = {},
): Promise<CartTotals> {
  const subtotal = subtotalOf(cart);

  let discount: Discount | null = null;
  let discountTotal = 0;
  let shippingTotal = 0;

  if (options.shippingOptionId) {
    const shipping = findShippingOption(options.shippingOptionId);
    if (!shipping) throw ApiError.badRequest('Unknown shipping option');
    shippingTotal = shipping.amount;
  }

  if (cart.discountCode) {
    const found = await discountRepository.findByCode(cart.storeId, cart.discountCode);
    if (found) {
      assertUsable(found, subtotal);
      discount = found;
      const scoped = eligibleSubtotal(cart, found);
      switch (found.type) {
        case DiscountType.PERCENTAGE:
          discountTotal = Math.round((scoped * found.value) / 100);
          break;
        case DiscountType.FIXED_AMOUNT:
          discountTotal = Math.min(found.value, scoped);
          break;
        case DiscountType.FREE_SHIPPING:
          discountTotal = 0;
          shippingTotal = 0;
          break;
      }
    }
  }

  discountTotal = Math.min(discountTotal, subtotal);
  const taxTotal = 0; // Tax rules land with the payments work in Phase 3.
  const total = Math.max(0, subtotal - discountTotal + shippingTotal + taxTotal);

  return { subtotal, discountTotal, shippingTotal, taxTotal, total, discount };
}
