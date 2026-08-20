import type { Discount } from '@prisma/client';
import type { DiscountDto, DiscountType } from '@cc/types';

/**
 * Collapses `active` plus the validity window plus usage into one status the UI
 * can render as a single badge, so the dashboard does not re-derive the rules.
 */
function deriveStatus(discount: Discount, now = Date.now()): DiscountDto['status'] {
  if (!discount.active) return 'DISABLED';
  if (discount.usageLimit !== null && discount.usageCount >= discount.usageLimit) return 'USED_UP';
  if (discount.startsAt && discount.startsAt.getTime() > now) return 'SCHEDULED';
  if (discount.endsAt && discount.endsAt.getTime() < now) return 'EXPIRED';
  return 'ACTIVE';
}

export function toDiscountDto(discount: Discount): DiscountDto {
  return {
    id: discount.id,
    storeId: discount.storeId,
    code: discount.code,
    type: discount.type as DiscountType,
    value: discount.value,
    minimumSpend: discount.minimumSpend,
    usageLimit: discount.usageLimit,
    usageCount: discount.usageCount,
    startsAt: discount.startsAt?.toISOString() ?? null,
    endsAt: discount.endsAt?.toISOString() ?? null,
    active: discount.active,
    productIds: discount.productIds,
    collectionIds: discount.collectionIds,
    status: deriveStatus(discount),
    createdAt: discount.createdAt.toISOString(),
  };
}
