import { z } from 'zod';
import { FulfillmentType, InventoryMode, ProductStatus } from '@cc/types';
import type { CreateProductInput } from '@cc/shared';
import { inputToMinor, minorToInput } from '@/lib/utils';

/**
 * The editor keeps money as text so the creator can type "890.50" naturally.
 * Conversion to integer minor units happens once, in `toProductPayload`.
 */
const moneyText = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d+(\.\d{1,2})?$/.test(value),
    'Use a number like 890 or 890.50',
  );

const requiredMoneyText = z
  .string()
  .trim()
  .min(1, 'Required')
  .regex(/^\d+(\.\d{1,2})?$/, 'Use a number like 890 or 890.50');

export const optionValueFieldSchema = z.object({
  value: z.string().trim().min(1, 'Required').max(60),
  group: z.string().trim().max(60),
});

export const optionFieldSchema = z.object({
  name: z.string().trim().min(1, 'Name this option').max(40),
  values: z.array(optionValueFieldSchema).min(1, 'Add at least one value'),
});

export const variantFieldSchema = z.object({
  optionValues: z.array(z.string()),
  title: z.string(),
  sku: z.string().trim().max(64),
  price: requiredMoneyText,
  compareAtPrice: moneyText,
  cost: moneyText,
  stock: z.coerce.number().int().min(0).max(1_000_000),
  enabled: z.boolean(),
  imageUrl: z.string().trim(),
  supplierSku: z.string().trim().max(120),
});

export const productFormSchema = z.object({
  title: z.string().trim().min(2, 'At least 2 characters').max(140),
  slug: z.string().trim().max(120),
  description: z.string().trim().max(20_000),
  status: z.nativeEnum(ProductStatus),
  category: z.string().trim().max(60),
  price: requiredMoneyText,
  compareAtPrice: moneyText,
  cost: moneyText,
  inventoryMode: z.nativeEnum(InventoryMode),
  fulfillmentType: z.nativeEnum(FulfillmentType),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(160),
  media: z.array(z.object({ url: z.string().trim().min(1), alt: z.string().trim().max(160) })),
  options: z.array(optionFieldSchema).max(4),
  variants: z.array(variantFieldSchema).max(500),
  collectionIds: z.array(z.string()),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type OptionField = z.infer<typeof optionFieldSchema>;
export type VariantField = z.infer<typeof variantFieldSchema>;

export function emptyProductForm(): ProductFormValues {
  return {
    title: '',
    slug: '',
    description: '',
    status: ProductStatus.DRAFT,
    category: '',
    price: '',
    compareAtPrice: '',
    cost: '',
    inventoryMode: InventoryMode.NOT_TRACKED,
    fulfillmentType: FulfillmentType.MANUAL,
    seoTitle: '',
    seoDescription: '',
    media: [],
    options: [],
    variants: [],
    collectionIds: [],
  };
}

export function toProductPayload(values: ProductFormValues): CreateProductInput {
  const optional = (value: string) => (value.trim() === '' ? null : inputToMinor(value));

  return {
    title: values.title,
    ...(values.slug ? { slug: values.slug } : {}),
    description: values.description || null,
    status: values.status,
    category: values.category || null,
    price: inputToMinor(values.price),
    compareAtPrice: optional(values.compareAtPrice),
    cost: optional(values.cost),
    inventoryMode: values.inventoryMode,
    fulfillmentType: values.fulfillmentType,
    seoTitle: values.seoTitle || null,
    seoDescription: values.seoDescription || null,
    metadata: {},
    media: values.media.map((item) => ({ url: item.url, alt: item.alt || null })),
    options: values.options.map((option) => ({
      name: option.name,
      values: option.values.map((value) => ({ value: value.value, group: value.group || null })),
    })),
    variants: values.variants.map((variant) => ({
      optionValues: variant.optionValues,
      sku: variant.sku || null,
      price: inputToMinor(variant.price),
      compareAtPrice: optional(variant.compareAtPrice),
      cost: optional(variant.cost),
      stock: variant.stock,
      enabled: variant.enabled,
      imageUrl: variant.imageUrl || null,
      supplierSku: variant.supplierSku || null,
    })),
    collectionIds: values.collectionIds,
  };
}

/** Loads an existing product back into editable form values. */
export function fromProductDto(product: {
  title: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  category: string | null;
  price: number;
  compareAtPrice: number | null;
  cost: number | null;
  inventoryMode: InventoryMode;
  fulfillmentType: FulfillmentType;
  seoTitle: string | null;
  seoDescription: string | null;
  media: Array<{ url: string; alt: string | null }>;
  options: Array<{ name: string; values: Array<{ value: string; group: string | null }> }>;
  variants: Array<{
    optionValues: string[];
    title: string;
    sku: string | null;
    price: number;
    compareAtPrice: number | null;
    cost: number | null;
    stock: number;
    enabled: boolean;
    imageUrl: string | null;
    supplierSku: string | null;
  }>;
  collectionIds: string[];
}): ProductFormValues {
  return {
    title: product.title,
    slug: product.slug,
    description: product.description ?? '',
    status: product.status,
    category: product.category ?? '',
    price: minorToInput(product.price),
    compareAtPrice: minorToInput(product.compareAtPrice),
    cost: minorToInput(product.cost),
    inventoryMode: product.inventoryMode,
    fulfillmentType: product.fulfillmentType,
    seoTitle: product.seoTitle ?? '',
    seoDescription: product.seoDescription ?? '',
    media: product.media.map((item) => ({ url: item.url, alt: item.alt ?? '' })),
    options: product.options.map((option) => ({
      name: option.name,
      values: option.values.map((value) => ({ value: value.value, group: value.group ?? '' })),
    })),
    variants: product.variants.map((variant) => ({
      optionValues: variant.optionValues,
      title: variant.title,
      sku: variant.sku ?? '',
      price: minorToInput(variant.price),
      compareAtPrice: minorToInput(variant.compareAtPrice),
      cost: minorToInput(variant.cost),
      stock: variant.stock,
      enabled: variant.enabled,
      imageUrl: variant.imageUrl ?? '',
      supplierSku: variant.supplierSku ?? '',
    })),
    collectionIds: product.collectionIds,
  };
}
