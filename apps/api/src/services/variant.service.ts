import type { Prisma } from '@prisma/client';
import {
  buildSku,
  cartesian,
  skuDeduper,
  type ProductOptionInput,
  type ProductVariantInput,
} from '@cc/shared';
import { ApiError } from '../utils/errors';

export interface VariantMatrixRow {
  optionValues: string[];
  title: string;
  suggestedSku: string;
}

/**
 * Expands option values into the full variant matrix.
 *
 * "Phone Model" x "Case Color" x "Case Type" with 5 / 4 / 2 values produces the
 * 40 combinations a creator would otherwise type by hand.
 */
export function buildVariantMatrix(
  productTitle: string,
  options: ProductOptionInput[],
): VariantMatrixRow[] {
  if (options.length === 0) return [];

  const total = options.reduce((product, option) => product * option.values.length, 1);
  if (total > 500) {
    throw ApiError.badRequest(
      `That combination produces ${total} variants. The limit is 500 — reduce option values or split the product.`,
    );
  }

  const combinations = cartesian(
    options.map((option) => option.values.map((value) => value.value)),
  );
  return combinations.map((optionValues) => ({
    optionValues,
    title: optionValues.join(' / '),
    suggestedSku: buildSku(productTitle, optionValues),
  }));
}

/** Stable signature for a variant, used to match input rows against DB rows. */
export function variantSignature(optionValueIds: readonly string[]): string {
  return [...optionValueIds].sort().join('|');
}

const DEFAULT_VARIANT_TITLE = 'Default';

export function defaultVariantInput(price: number, overrides: Partial<ProductVariantInput> = {}) {
  return {
    optionValues: [] as string[],
    price,
    stock: 0,
    enabled: true,
    ...overrides,
  };
}

export { DEFAULT_VARIANT_TITLE };

/** Ensures SKUs are unique within a store, appending `-2`, `-3`, ... on collision. */
export async function assignUniqueSkus(
  tx: Prisma.TransactionClient,
  storeId: string,
  productId: string | null,
  desired: Array<{ key: string; sku: string | null }>,
): Promise<Map<string, string | null>> {
  const candidates = desired.map((entry) => entry.sku).filter((sku): sku is string => Boolean(sku));

  const existing =
    candidates.length > 0
      ? await tx.productVariant.findMany({
          where: {
            storeId,
            sku: { in: candidates },
            ...(productId ? { NOT: { productId } } : {}),
          },
          select: { sku: true },
        })
      : [];

  // Seed the deduper with SKUs other products already own, so a suffix is only
  // added when it is genuinely needed.
  const dedupe = skuDeduper(
    existing.map((row) => row.sku).filter((sku): sku is string => Boolean(sku)),
  );

  const result = new Map<string, string | null>();
  for (const entry of desired) {
    result.set(entry.key, entry.sku ? dedupe(entry.sku) : null);
  }
  return result;
}
