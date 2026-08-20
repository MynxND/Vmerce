import { CollectionStatus, ProductStatus } from '@cc/types';
import type { CollectionDto, ProductDto, StorefrontStoreDto } from '@cc/types';
import { DEFAULT_SHIPPING_OPTIONS } from '@cc/shared';
import { prisma } from '../config/prisma';
import { productInclude } from '../repositories/product.repository';
import { storeRepository } from '../repositories/store.repository';
import { toProductDto, toProductListItemDto } from '../mappers/product.mapper';
import { toCollectionDto } from '../mappers/collection.mapper';
import { toPageDto, toStoreDto, toThemeDto } from '../mappers/store.mapper';
import { ApiError } from '../utils/errors';
import { storeService } from './store.service';
import { paymentChannelService } from './payment-channel.service';

/** Only published stores are visible publicly. */
async function requirePublishedStore(handle: string) {
  const store = await storeRepository.findByHandle(handle);
  if (!store || store.status !== 'ACTIVE') {
    throw ApiError.notFound('Store not found', 'STORE_NOT_FOUND');
  }
  return store;
}

export const storefrontService = {
  async getStore(handle: string): Promise<StorefrontStoreDto> {
    const store = await requirePublishedStore(handle);
    const theme = await storeService.getTheme(store.id);
    const dto = toStoreDto(store);

    return {
      id: dto.id,
      name: dto.name,
      handle: dto.handle,
      description: dto.description,
      creatorType: dto.creatorType,
      logoUrl: dto.logoUrl,
      avatarUrl: dto.avatarUrl,
      bannerUrl: dto.bannerUrl,
      currency: dto.currency,
      socialLinks: dto.socialLinks,
      theme,
    };
  },

  async getHomePage(handle: string) {
    const store = await requirePublishedStore(handle);
    const page = await storeRepository.findPageBySlug(store.id, 'home');
    if (!page) throw ApiError.notFound('Storefront has no home page yet');
    return toPageDto(page);
  },

  async listProducts(
    handle: string,
    params: { collectionSlug?: string; limit: number; page: number },
  ) {
    const store = await requirePublishedStore(handle);

    const where = {
      storeId: store.id,
      status: ProductStatus.ACTIVE,
      ...(params.collectionSlug
        ? { collections: { some: { collection: { slug: params.collectionSlug } } } }
        : {}),
    };

    const [rows, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          media: { orderBy: { position: 'asc' }, take: 1 },
          variants: { select: { id: true, stock: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: rows.map((row) => toProductListItemDto(row, store.currency)),
      total,
      page: params.page,
      perPage: params.limit,
    };
  },

  async getProduct(handle: string, slug: string): Promise<ProductDto> {
    const store = await requirePublishedStore(handle);
    const product = await prisma.product.findUnique({
      where: { storeId_slug: { storeId: store.id, slug } },
      include: productInclude,
    });
    if (!product || product.status !== ProductStatus.ACTIVE) {
      throw ApiError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
    }
    return toProductDto(product, store.currency);
  },

  async listCollections(handle: string): Promise<CollectionDto[]> {
    const store = await requirePublishedStore(handle);
    const rows = await prisma.collection.findMany({
      where: { storeId: store.id, status: CollectionStatus.ACTIVE },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    return rows.map((row) => toCollectionDto(row, row._count.products));
  },

  async getCollection(handle: string, slug: string) {
    const store = await requirePublishedStore(handle);
    const collection = await prisma.collection.findUnique({
      where: { storeId_slug: { storeId: store.id, slug } },
      include: { _count: { select: { products: true } } },
    });
    if (!collection || collection.status !== CollectionStatus.ACTIVE) {
      throw ApiError.notFound('Collection not found', 'COLLECTION_NOT_FOUND');
    }

    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
        status: ProductStatus.ACTIVE,
        collections: { some: { collectionId: collection.id } },
      },
      include: {
        media: { orderBy: { position: 'asc' }, take: 1 },
        variants: { select: { id: true, stock: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      collection: toCollectionDto(collection, collection._count.products),
      products: products.map((row) => toProductListItemDto(row, store.currency)),
    };
  },

  async relatedProducts(handle: string, productId: string, limit = 4) {
    const store = await requirePublishedStore(handle);
    const rows = await prisma.product.findMany({
      where: { storeId: store.id, status: ProductStatus.ACTIVE, NOT: { id: productId } },
      include: {
        media: { orderBy: { position: 'asc' }, take: 1 },
        variants: { select: { id: true, stock: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => toProductListItemDto(row, store.currency));
  },

  /**
   * Checkout options. Shipping is still flat-rate until a fulfillment provider
   * supplies real rates; payment methods come from whatever the creator has
   * configured, with account identifiers masked until an order exists.
   */
  async checkoutOptions(handle: string) {
    const store = await requirePublishedStore(handle);
    return {
      currency: store.currency,
      shippingOptions: DEFAULT_SHIPPING_OPTIONS,
      paymentChannels: await paymentChannelService.listForStorefront(store.id),
    };
  },

  async getTheme(handle: string) {
    const store = await requirePublishedStore(handle);
    const theme = await storeRepository.findTheme(store.id);
    if (!theme) throw ApiError.notFound('Theme not found');
    return toThemeDto(theme);
  },
};
