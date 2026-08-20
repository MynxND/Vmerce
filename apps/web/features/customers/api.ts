import type { AddressDto, CustomerDto, OrderListItemDto, Paginated } from '@cc/types';
import { api } from '@/services/http';

export type CustomerDetail = CustomerDto & {
  addresses: Array<AddressDto & { id: string; kind: string; isDefault: boolean }>;
  orders: OrderListItemDto[];
};

export const customersApi = {
  list: (storeId: string, query: { page?: number; perPage?: number; search?: string } = {}) =>
    api.get<Paginated<CustomerDto>>(`/stores/${storeId}/customers`, {
      query: { page: query.page ?? 1, perPage: query.perPage ?? 20, search: query.search },
    }),

  get: (storeId: string, customerId: string) =>
    api.get<CustomerDetail>(`/stores/${storeId}/customers/${customerId}`),
};

export const customerKeys = {
  all: (storeId: string) => ['stores', storeId, 'customers'] as const,
  list: (storeId: string, page: number, search?: string) =>
    ['stores', storeId, 'customers', 'list', page, search ?? ''] as const,
  detail: (storeId: string, customerId: string) =>
    ['stores', storeId, 'customers', customerId] as const,
};
