import { z } from 'zod';
import { isReservedHandle } from '../utils';

export const cuidSchema = z.string().min(1, 'Required');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Integer minor-unit money (satang / cents). Rejects floats outright. */
export const moneySchema = z
  .number({ invalid_type_error: 'Must be a number' })
  .int('Use the smallest currency unit (no decimals)')
  .min(0, 'Cannot be negative')
  .max(1_000_000_000);

/**
 * Same as `moneySchema`, but for `multipart/form-data` bodies where every field
 * arrives as text and so has to be coerced before validation.
 */
export const formMoneySchema = z.coerce
  .number({ invalid_type_error: 'Must be a number' })
  .int('Use the smallest currency unit (no decimals)')
  .min(0, 'Cannot be negative')
  .max(1_000_000_000);

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'At least 3 characters')
  .max(32, 'At most 32 characters')
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Lowercase letters, numbers and dashes only')
  .refine((value) => !value.includes('--'), 'No consecutive dashes')
  .refine((value) => !isReservedHandle(value), 'That handle is reserved');

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, 'Letters, numbers and dashes only');

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex colour, e.g. #7c5cff');

export const urlSchema = z.string().trim().url('Must be a valid URL');
export const nullableUrlSchema = urlSchema.nullish().transform((value) => value ?? null);

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

export const phoneSchema = z
  .string()
  .trim()
  .min(6)
  .max(24)
  .regex(/^[0-9+\-() ]+$/, 'Enter a valid phone number');
