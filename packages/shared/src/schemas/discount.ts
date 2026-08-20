import { z } from 'zod';
import { DiscountType } from '@cc/types';
import { moneySchema } from './common';

/**
 * Discount codes.
 *
 * `value` is overloaded by type — percent (0-100) for PERCENTAGE, minor currency
 * units for FIXED_AMOUNT, ignored for FREE_SHIPPING — so it is validated in a
 * refinement rather than by the field schema alone.
 */
const baseDiscountSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, 'At least 3 characters')
    .max(40)
    .regex(/^[A-Z0-9][A-Z0-9_-]*$/, 'Letters, numbers, dashes and underscores only'),
  type: z.nativeEnum(DiscountType),
  value: z.coerce.number().int().min(0).max(100_000_000),
  minimumSpend: moneySchema.nullish().transform((value) => value ?? null),
  usageLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(1_000_000)
    .nullish()
    .transform((value) => value ?? null),
  startsAt: z
    .string()
    .datetime({ offset: true })
    .nullish()
    .transform((value) => value ?? null),
  endsAt: z
    .string()
    .datetime({ offset: true })
    .nullish()
    .transform((value) => value ?? null),
  active: z.boolean().default(true),
  productIds: z.array(z.string()).max(200).default([]),
  collectionIds: z.array(z.string()).max(200).default([]),
});

function validateDiscount(
  data: {
    type: DiscountType;
    value: number;
    startsAt?: string | null;
    endsAt?: string | null;
  },
  ctx: z.RefinementCtx,
): void {
  if (data.type === DiscountType.PERCENTAGE && (data.value < 1 || data.value > 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'A percentage discount must be between 1 and 100',
    });
  }
  if (data.type === DiscountType.FIXED_AMOUNT && data.value < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Enter the amount to take off',
    });
  }
  if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endsAt'],
      message: 'The end date must be after the start date',
    });
  }
}

export const createDiscountSchema = baseDiscountSchema.superRefine(validateDiscount);
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;

export const updateDiscountSchema = baseDiscountSchema.partial().superRefine((data, ctx) => {
  if (data.type === undefined || data.value === undefined) {
    // Nothing to cross-check unless both arrived together.
    if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'The end date must be after the start date',
      });
    }
    return;
  }
  validateDiscount(
    { type: data.type, value: data.value, startsAt: data.startsAt, endsAt: data.endsAt },
    ctx,
  );
});
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
