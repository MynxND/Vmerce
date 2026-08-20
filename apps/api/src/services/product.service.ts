import type { Prisma } from '@prisma/client';
import type { Paginated, ProductDto, ProductListItemDto } from '@cc/types';
import { ProductStatus } from '@cc/types';
import {
  buildSku,
  slugify,
  type CreateProductInput,
  type ProductListQuery,
  type ProductOptionInput,
  type ProductVariantInput,
  type UpdateProductInput,
} from '@cc/shared';
import { prisma } from '../config/prisma';
import { productRepository } from '../repositories/product.repository';
import { storeRepository } from '../repositories/store.repository';
import { toProductDto, toProductListItemDto } from '../mappers/product.mapper';
import { ApiError } from '../utils/errors';
import { paginated } from '../utils/response';
import { uniqueSlug } from '../utils/slug';
import { DEFAULT_VARIANT_TITLE, assignUniqueSkus, variantSignature } from './variant.service';

const ORDER_BY: Record<ProductListQuery['sort'], Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  title: { title: 'asc' },
  priceAsc: { price: 'asc' },
  priceDesc: { price: 'desc' },
};

async function storeCurrency(storeId: string): Promise<string> {
  const store = await storeRepository.findById(storeId);
  return store?.currency ?? 'THB';
}

/**
 * Replaces a product's option/variant graph.
 *
 * Variants are matched to existing rows by their option-value signature rather
 * than by id, so renaming a colour keeps its stock while adding a new colour only
 * inserts the new combinations.
 */
async function syncOptionsAndVariants(
  tx: Prisma.TransactionClient,
  params: {
    storeId: string;
    productId: string;
    productTitle: string;
    fallbackPrice: number;
    options: ProductOptionInput[];
    variants: ProductVariantInput[];
  },
): Promise<void> {
  const { storeId, productId, productTitle, fallbackPrice, options, variants } = params;

  // ---- options ------------------------------------------------------------
  const existingOptions = await tx.productOption.findMany({
    where: { productId },
    include: { values: true },
  });

  const keptOptionNames = new Set(options.map((option) => option.name));
  const removedOptions = existingOptions.filter((option) => !keptOptionNames.has(option.name));
  if (removedOptions.length > 0) {
    await tx.productOption.deleteMany({ where: { id: { in: removedOptions.map((o) => o.id) } } });
  }

  /** option name -> (value text -> value id) */
  const valueIds = new Map<string, Map<string, string>>();

  for (const [index, option] of options.entries()) {
    const existing = existingOptions.find((row) => row.name === option.name);
    const optionId = existing
      ? (
          await tx.productOption.update({
            where: { id: existing.id },
            data: { position: index },
            select: { id: true },
          })
        ).id
      : (
          await tx.productOption.create({
            data: { productId, name: option.name, position: index },
            select: { id: true },
          })
        ).id;

    const existingValues = existing?.values ?? [];
    const keptValues = new Set(option.values.map((value) => value.value));
    const removedValues = existingValues.filter((value) => !keptValues.has(value.value));
    if (removedValues.length > 0) {
      await tx.productOptionValue.deleteMany({
        where: { id: { in: removedValues.map((value) => value.id) } },
      });
    }

    const map = new Map<string, string>();
    for (const [valueIndex, value] of option.values.entries()) {
      const found = existingValues.find((row) => row.value === value.value);
      const id = found
        ? (
            await tx.productOptionValue.update({
              where: { id: found.id },
              data: { position: valueIndex, group: value.group ?? null },
              select: { id: true },
            })
          ).id
        : (
            await tx.productOptionValue.create({
              data: {
                optionId,
                value: value.value,
                group: value.group ?? null,
                position: valueIndex,
              },
              select: { id: true },
            })
          ).id;
      map.set(value.value, id);
    }
    valueIds.set(option.name, map);
  }

  // ---- variants -----------------------------------------------------------
  const existingVariants = await tx.productVariant.findMany({
    where: { productId },
    include: { optionValues: true },
  });
  const bySignature = new Map(
    existingVariants.map((variant) => [
      variantSignature(variant.optionValues.map((row) => row.optionValueId)),
      variant,
    ]),
  );

  interface Resolved {
    signature: string;
    optionValueIds: string[];
    title: string;
    input: ProductVariantInput;
  }

  const resolved: Resolved[] = [];

  if (options.length === 0) {
    // Optionless products still need exactly one purchasable variant.
    const input: ProductVariantInput = variants[0] ?? {
      optionValues: [],
      price: fallbackPrice,
      stock: 0,
      enabled: true,
      imageUrl: null,
    };
    resolved.push({
      signature: variantSignature([]),
      optionValueIds: [],
      title: DEFAULT_VARIANT_TITLE,
      input,
    });
  } else {
    for (const variant of variants) {
      const ids: string[] = [];
      for (const [index, option] of options.entries()) {
        const text = variant.optionValues[index];
        const id = text ? valueIds.get(option.name)?.get(text) : undefined;
        if (!id) {
          throw ApiError.badRequest(
            `Variant "${variant.optionValues.join(' / ')}" references an unknown ${option.name} value`,
          );
        }
        ids.push(id);
      }
      resolved.push({
        signature: variantSignature(ids),
        optionValueIds: ids,
        title: variant.optionValues.join(' / '),
        input: variant,
      });
    }

    const seen = new Set<string>();
    for (const row of resolved) {
      if (seen.has(row.signature)) {
        throw ApiError.badRequest(`Duplicate variant: ${row.title}`);
      }
      seen.add(row.signature);
    }
  }

  const skuMap = await assignUniqueSkus(
    tx,
    storeId,
    productId,
    resolved.map((row) => ({
      key: row.signature,
      sku: row.input.sku?.trim() || buildSku(productTitle, row.input.optionValues),
    })),
  );

  const keptSignatures = new Set(resolved.map((row) => row.signature));
  const removedVariants = existingVariants.filter(
    (variant) =>
      !keptSignatures.has(variantSignature(variant.optionValues.map((row) => row.optionValueId))),
  );
  if (removedVariants.length > 0) {
    await tx.productVariant.deleteMany({ where: { id: { in: removedVariants.map((v) => v.id) } } });
  }

  for (const [position, row] of resolved.entries()) {
    const existing = bySignature.get(row.signature);
    const data = {
      title: row.title,
      sku: skuMap.get(row.signature) ?? null,
      price: row.input.price,
      compareAtPrice: row.input.compareAtPrice ?? null,
      cost: row.input.cost ?? null,
      stock: row.input.stock ?? 0,
      enabled: row.input.enabled ?? true,
      imageUrl: row.input.imageUrl ?? null,
      supplierSku: row.input.supplierSku ?? null,
      position,
    };

    if (existing) {
      await tx.productVariant.update({ where: { id: existing.id }, data });
      continue;
    }

    await tx.productVariant.create({
      data: {
        ...data,
        productId,
        storeId,
        optionValues: {
          create: row.optionValueIds.map((optionValueId) => ({ optionValueId })),
        },
      },
    });
  }
}

async function replaceMedia(
  tx: Prisma.TransactionClient,
  productId: string,
  media: NonNullable<CreateProductInput['media']>,
): Promise<void> {
  await tx.productMedia.deleteMany({ where: { productId } });
  if (media.length === 0) return;
  await tx.productMedia.createMany({
    data: media.map((item, index) => ({
      productId,
      url: item.url,
      alt: item.alt ?? null,
      position: index,
    })),
  });
}

async function replaceCollections(
  tx: Prisma.TransactionClient,
  storeId: string,
  productId: string,
  collectionIds: string[],
): Promise<void> {
  await tx.collectionProduct.deleteMany({ where: { productId } });
  if (collectionIds.length === 0) return;

  // Silently drop ids from other tenants rather than trusting the payload.
  const owned = await tx.collection.findMany({
    where: { id: { in: collectionIds }, storeId },
    select: { id: true },
  });
  if (owned.length === 0) return;

  await tx.collectionProduct.createMany({
    data: owned.map((collection, index) => ({
      collectionId: collection.id,
      productId,
      position: index,
    })),
    skipDuplicates: true,
  });
}

export const productService = {
  async list(storeId: string, query: ProductListQuery): Promise<Paginated<ProductListItemDto>> {
    const where: Prisma.ProductWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    if (query.collectionId) {
      where.collections = { some: { collectionId: query.collectionId } };
    }

    const [{ rows, total }, currency] = await Promise.all([
      productRepository.list({
        storeId,
        where,
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
      }),
      storeCurrency(storeId),
    ]);

    return paginated(
      rows.map((row) => toProductListItemDto(row, currency)),
      query.page,
      query.perPage,
      total,
    );
  },

  async getById(storeId: string, productId: string): Promise<ProductDto> {
    const product = await productRepository.findById(storeId, productId);
    if (!product) throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    return toProductDto(product, await storeCurrency(storeId));
  },

  async create(storeId: string, input: CreateProductInput): Promise<ProductDto> {
    const slug = await uniqueSlug(
      input.slug ?? slugify(input.title),
      (candidate) => productRepository.slugExists(storeId, candidate),
      'product',
    );

    const productId = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          storeId,
          title: input.title,
          slug,
          description: input.description ?? null,
          status: input.status,
          category: input.category ?? null,
          price: input.price,
          compareAtPrice: input.compareAtPrice ?? null,
          cost: input.cost ?? null,
          inventoryMode: input.inventoryMode,
          fulfillmentType: input.fulfillmentType,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          metadata: input.metadata as Prisma.InputJsonValue,
          publishedAt: input.status === ProductStatus.ACTIVE ? new Date() : null,
        },
        select: { id: true },
      });

      await replaceMedia(tx, product.id, input.media);
      await replaceCollections(tx, storeId, product.id, input.collectionIds);
      await syncOptionsAndVariants(tx, {
        storeId,
        productId: product.id,
        productTitle: input.title,
        fallbackPrice: input.price,
        options: input.options,
        variants: input.variants,
      });

      return product.id;
    });

    return productService.getById(storeId, productId);
  },

  async update(storeId: string, productId: string, input: UpdateProductInput): Promise<ProductDto> {
    const existing = await productRepository.findById(storeId, productId);
    if (!existing) throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');

    const slug =
      input.slug && input.slug !== existing.slug
        ? await uniqueSlug(
            input.slug,
            (candidate) => productRepository.slugExists(storeId, candidate),
            'product',
          )
        : undefined;

    await prisma.$transaction(async (tx) => {
      const data: Prisma.ProductUpdateInput = {};
      if (input.title !== undefined) data.title = input.title;
      if (slug !== undefined) data.slug = slug;
      if (input.description !== undefined) data.description = input.description ?? null;
      if (input.category !== undefined) data.category = input.category ?? null;
      if (input.price !== undefined) data.price = input.price;
      if (input.compareAtPrice !== undefined) data.compareAtPrice = input.compareAtPrice ?? null;
      if (input.cost !== undefined) data.cost = input.cost ?? null;
      if (input.inventoryMode !== undefined) data.inventoryMode = input.inventoryMode;
      if (input.fulfillmentType !== undefined) data.fulfillmentType = input.fulfillmentType;
      if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle ?? null;
      if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription ?? null;
      if (input.metadata !== undefined) data.metadata = input.metadata as Prisma.InputJsonValue;
      if (input.status !== undefined) {
        data.status = input.status;
        if (input.status === ProductStatus.ACTIVE && !existing.publishedAt) {
          data.publishedAt = new Date();
        }
      }

      if (Object.keys(data).length > 0) {
        await tx.product.update({ where: { id: productId }, data });
      }

      if (input.media !== undefined) await replaceMedia(tx, productId, input.media);
      if (input.collectionIds !== undefined) {
        await replaceCollections(tx, storeId, productId, input.collectionIds);
      }

      if (input.options !== undefined || input.variants !== undefined) {
        await syncOptionsAndVariants(tx, {
          storeId,
          productId,
          productTitle: input.title ?? existing.title,
          fallbackPrice: input.price ?? existing.price,
          options:
            input.options ??
            existing.options.map((option) => ({
              name: option.name,
              values: option.values.map((value) => ({ value: value.value, group: value.group })),
            })),
          variants: input.variants ?? [],
        });
      }
    });

    return productService.getById(storeId, productId);
  },

  async remove(storeId: string, productId: string): Promise<void> {
    const existing = await productRepository.findById(storeId, productId);
    if (!existing) throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    // OrderItem.productId is `onDelete: SetNull`, so order history is preserved.
    await productRepository.delete(productId);
  },

  async duplicate(storeId: string, productId: string): Promise<ProductDto> {
    const source = await productService.getById(storeId, productId);
    return productService.create(storeId, {
      title: `${source.title} (copy)`,
      description: source.description,
      status: ProductStatus.DRAFT,
      category: source.category,
      price: source.price,
      compareAtPrice: source.compareAtPrice,
      cost: source.cost,
      inventoryMode: source.inventoryMode,
      fulfillmentType: source.fulfillmentType,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      metadata: source.metadata,
      media: source.media.map((item) => ({ url: item.url, alt: item.alt })),
      options: source.options.map((option) => ({
        name: option.name,
        values: option.values.map((value) => ({ value: value.value, group: value.group })),
      })),
      variants: source.variants.map((variant) => ({
        optionValues: variant.optionValues,
        // Let the service mint fresh SKUs so the copy does not collide.
        sku: null,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        cost: variant.cost,
        stock: variant.stock,
        enabled: variant.enabled,
        imageUrl: variant.imageUrl,
        supplierSku: variant.supplierSku,
      })),
      collectionIds: source.collectionIds,
    });
  },
};
