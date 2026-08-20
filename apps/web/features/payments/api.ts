import type { OrderDto, PaymentChannelDto, PaymentProofDto } from '@cc/types';
import type {
  CreatePaymentChannelInput,
  ReviewPaymentProofInput,
  ThaiBank,
  UpdatePaymentChannelInput,
} from '@cc/shared';
import { api } from '@/services/http';

export const paymentsApi = {
  banks: () => api.get<ThaiBank[]>('/stores/banks'),

  listChannels: (storeId: string) =>
    api.get<PaymentChannelDto[]>(`/stores/${storeId}/payments/channels`),

  createChannel: (storeId: string, input: CreatePaymentChannelInput) =>
    api.post<PaymentChannelDto>(`/stores/${storeId}/payments/channels`, input),

  updateChannel: (storeId: string, channelId: string, input: UpdatePaymentChannelInput) =>
    api.patch<PaymentChannelDto>(`/stores/${storeId}/payments/channels/${channelId}`, input),

  removeChannel: (storeId: string, channelId: string) =>
    api.delete<void>(`/stores/${storeId}/payments/channels/${channelId}`),

  reorderChannels: (storeId: string, ids: string[]) =>
    api.post<{ reordered: number }>(`/stores/${storeId}/payments/channels/reorder`, { ids }),

  listProofs: (storeId: string, orderId: string) =>
    api.get<PaymentProofDto[]>(`/stores/${storeId}/orders/${orderId}/payment-proofs`),

  reviewProof: (storeId: string, proofId: string, input: ReviewPaymentProofInput) =>
    api.patch<{ proof: PaymentProofDto; order: OrderDto }>(
      `/stores/${storeId}/payments/proofs/${proofId}`,
      input,
    ),

  pendingCount: (storeId: string) =>
    api.get<{ pending: number }>(`/stores/${storeId}/payments/pending-count`),
};

export const paymentKeys = {
  all: (storeId: string) => ['stores', storeId, 'payments'] as const,
  channels: (storeId: string) => ['stores', storeId, 'payments', 'channels'] as const,
  banks: ['banks'] as const,
  proofs: (storeId: string, orderId: string) =>
    ['stores', storeId, 'orders', orderId, 'payment-proofs'] as const,
  pending: (storeId: string) => ['stores', storeId, 'payments', 'pending'] as const,
};
