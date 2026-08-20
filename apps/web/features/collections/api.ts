import type { CollectionDto, Paginated } from '@cc/types';
import type { CreateCollectionInput, UpdateCollectionInput } from '@cc/shared';
import { api } from '@/services/http';

export type CollectionDetail = CollectionDto & { productIds: string[] };

export const collectionsApi = {
  list: (storeId: string, query: { page?: number; perPage?: number; search?: string } = {}) =>
    api.get<Paginated<CollectionDto>>(`/stores/${storeId}/collections`, {
      query: { page: query.page ?? 1, perPage: query.perPage ?? 50, search: query.search },
    }),

  get: (storeId: string, collectionId: string) =>
    api.get<CollectionDetail>(`/stores/${storeId}/collections/${collectionId}`),

  create: (storeId: string, input: CreateCollectionInput) =>
    api.post<CollectionDto>(`/stores/${storeId}/collections`, input),

  update: (storeId: string, collectionId: string, input: UpdateCollectionInput) =>
    api.patch<CollectionDto>(`/stores/${storeId}/collections/${collectionId}`, input),

  remove: (storeId: string, collectionId: string) =>
    api.delete<void>(`/stores/${storeId}/collections/${collectionId}`),

  reorder: (storeId: string, ids: string[]) =>
    api.post<{ reordered: number }>(`/stores/${storeId}/collections/reorder`, { ids }),
};

export const collectionKeys = {
  all: (storeId: string) => ['stores', storeId, 'collections'] as const,
  list: (storeId: string, search?: string) =>
    ['stores', storeId, 'collections', 'list', search ?? ''] as const,
  detail: (storeId: string, collectionId: string) =>
    ['stores', storeId, 'collections', collectionId] as const,
};
