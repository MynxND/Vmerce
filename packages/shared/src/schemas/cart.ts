import { z } from 'zod';

export const addCartItemSchema = z.object({
  variantId: z.string().min(1, 'Choose a variant'),
  quantity: z.number().int().min(1).max(99).default(1),
});
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const applyDiscountSchema = z.object({
  code: z.string().trim().toUpperCase().min(2).max(40).nullable(),
});
