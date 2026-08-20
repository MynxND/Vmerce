import type { Paginated, ProductDto, ProductListItemDto } from '@cc/types';
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from '@cc/shared';
import { api } from '@/services/http';

export const productsApi = {
  list: (storeId: string, query: Partial<ProductListQuery>) =>
    api.get<Paginated<ProductListItemDto>>(`/stores/${storeId}/products`, {
      query: {
        page: query.page ?? 1,
        perPage: query.perPage ?? 20,
        search: query.search,
        status: query.status,
        collectionId: query.collectionId,
        sort: query.sort ?? 'newest',
      },
    }),

  get: (storeId: string, productId: string) =>
    api.get<ProductDto>(`/stores/${storeId}/products/${productId}`),

  create: (storeId: string, input: CreateProductInput) =>
    api.post<ProductDto>(`/stores/${storeId}/products`, input),

  update: (storeId: string, productId: string, input: UpdateProductInput) =>
    api.patch<ProductDto>(`/stores/${storeId}/products/${productId}`, input),

  remove: (storeId: string, productId: string) =>
    api.delete<void>(`/stores/${storeId}/products/${productId}`),

  duplicate: (storeId: string, productId: string) =>
    api.post<ProductDto>(`/stores/${storeId}/products/${productId}/duplicate`),
};

export const productKeys = {
  all: (storeId: string) => ['stores', storeId, 'products'] as const,
  list: (storeId: string, query: Partial<ProductListQuery>) =>
    ['stores', storeId, 'products', 'list', query] as const,
  detail: (storeId: string, productId: string) =>
    ['stores', storeId, 'products', productId] as const,
};
