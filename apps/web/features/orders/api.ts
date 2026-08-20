import type { OrderDto, OrderListItemDto, Paginated } from '@cc/types';
import type { OrderListQuery, UpdateOrderInput } from '@cc/shared';
import { api } from '@/services/http';

export const ordersApi = {
  list: (storeId: string, query: Partial<OrderListQuery>) =>
    api.get<Paginated<OrderListItemDto>>(`/stores/${storeId}/orders`, {
      query: {
        page: query.page ?? 1,
        perPage: query.perPage ?? 20,
        search: query.search,
        status: query.status,
        paymentStatus: query.paymentStatus,
        fulfillmentStatus: query.fulfillmentStatus,
      },
    }),

  get: (storeId: string, orderId: string) =>
    api.get<OrderDto>(`/stores/${storeId}/orders/${orderId}`),

  update: (storeId: string, orderId: string, input: UpdateOrderInput) =>
    api.patch<OrderDto>(`/stores/${storeId}/orders/${orderId}`, input),
};

export const orderKeys = {
  all: (storeId: string) => ['stores', storeId, 'orders'] as const,
  list: (storeId: string, query: Partial<OrderListQuery>) =>
    ['stores', storeId, 'orders', 'list', query] as const,
  detail: (storeId: string, orderId: string) => ['stores', storeId, 'orders', orderId] as const,
};
