import type { DiscountDto, Paginated } from '@cc/types';
import type { CreateDiscountInput, UpdateDiscountInput } from '@cc/shared';
import { api } from '@/services/http';

export const discountsApi = {
  list: (storeId: string, query: { page?: number; perPage?: number; search?: string } = {}) =>
    api.get<Paginated<DiscountDto>>(`/stores/${storeId}/discounts`, {
      query: { page: query.page ?? 1, perPage: query.perPage ?? 50, search: query.search },
    }),

  get: (storeId: string, discountId: string) =>
    api.get<DiscountDto>(`/stores/${storeId}/discounts/${discountId}`),

  create: (storeId: string, input: CreateDiscountInput) =>
    api.post<DiscountDto>(`/stores/${storeId}/discounts`, input),

  update: (storeId: string, discountId: string, input: UpdateDiscountInput) =>
    api.patch<DiscountDto>(`/stores/${storeId}/discounts/${discountId}`, input),

  remove: (storeId: string, discountId: string) =>
    api.delete<void>(`/stores/${storeId}/discounts/${discountId}`),
};

export const discountKeys = {
  all: (storeId: string) => ['stores', storeId, 'discounts'] as const,
  list: (storeId: string, search?: string) =>
    ['stores', storeId, 'discounts', 'list', search ?? ''] as const,
};
