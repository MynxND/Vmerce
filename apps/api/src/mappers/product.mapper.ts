import type {
  FulfillmentType,
  InventoryMode,
  ProductDto,
  ProductListItemDto,
  ProductStatus,
  ProductVariantDto,
} from '@cc/types';
import type { ProductListRow, ProductWithRelations } from '../repositories/product.repository';

export function toProductDto(product: ProductWithRelations, currency: string): ProductDto {
  const optionOrder = new Map(product.options.map((option, index) => [option.id, index]));

  const variants: ProductVariantDto[] = product.variants.map((variant) => {
    // Re-sort the join rows into option order so `optionValues[0]` always refers
    // to the first option, regardless of insertion order.
    const sorted = [...variant.optionValues].sort(
      (a, b) =>
        (optionOrder.get(a.optionValue.optionId) ?? 0) -
        (optionOrder.get(b.optionValue.optionId) ?? 0),
    );
    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      title: variant.title,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      cost: variant.cost,
      stock: variant.stock,
      enabled: variant.enabled,
      imageUrl: variant.imageUrl,
      supplierSku: variant.supplierSku,
      optionValueIds: sorted.map((row) => row.optionValueId),
      optionValues: sorted.map((row) => row.optionValue.value),
    };
  });

  return {
    id: product.id,
    storeId: product.storeId,
    title: product.title,
    slug: product.slug,
    description: product.description,
    status: product.status as ProductStatus,
    category: product.category,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    cost: product.cost,
    currency,
    inventoryMode: product.inventoryMode as InventoryMode,
    fulfillmentType: product.fulfillmentType as FulfillmentType,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    metadata: (product.metadata ?? {}) as Record<string, unknown>,
    media: product.media.map((item) => ({
      id: item.id,
      url: item.url,
      alt: item.alt,
      position: item.position,
    })),
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      position: option.position,
      values: option.values.map((value) => ({
        id: value.id,
        value: value.value,
        position: value.position,
        group: value.group,
      })),
    })),
    variants,
    collectionIds: product.collections.map((row) => row.collectionId),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toProductListItemDto(row: ProductListRow, currency: string): ProductListItemDto {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status as ProductStatus,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    currency,
    thumbnailUrl: row.media[0]?.url ?? null,
    variantCount: row.variants.length,
    totalStock: row.variants.reduce((sum, variant) => sum + variant.stock, 0),
    fulfillmentType: row.fulfillmentType as FulfillmentType,
    updatedAt: row.updatedAt.toISOString(),
  };
}
