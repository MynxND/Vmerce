import { z } from 'zod';
import { emailSchema, phoneSchema } from './common';

export const addressSchema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(60),
  lastName: z.string().trim().min(1, 'Required').max(60),
  phone: phoneSchema.nullish(),
  line1: z.string().trim().min(3, 'Required').max(200),
  line2: z.string().trim().max(200).nullish(),
  district: z.string().trim().max(120).nullish(),
  province: z.string().trim().min(1, 'Required').max(120),
  postalCode: z.string().trim().min(3, 'Required').max(16),
  country: z.string().trim().length(2).toUpperCase().default('TH'),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z.object({
  cartToken: z.string().min(1),
  email: emailSchema,
  phone: phoneSchema.nullish(),
  shippingAddress: addressSchema,
  /** Shipping option id returned by `GET /storefront/:handle/shipping-options`. */
  shippingOptionId: z.string().min(1),
  /**
   * The store payment channel the buyer picked. Omitted falls back to the
   * store's default channel; a store with no channels configured falls back to
   * the `manual` provider so checkout never hard-fails on configuration.
   */
  paymentChannelId: z
    .string()
    .min(1)
    .nullish()
    .transform((value) => value ?? null),
  /** Legacy escape hatch for a future external PSP key. */
  paymentProvider: z.string().trim().min(1).default('manual'),
  note: z.string().trim().max(500).nullish(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Please accept the terms to continue' }),
  }),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
