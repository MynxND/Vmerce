import type { PaymentProofDto, PaymentProofStatus } from '@cc/types';
import type { PaymentProofRow } from '../repositories/payment.repository';

export function toPaymentProofDto(proof: PaymentProofRow): PaymentProofDto {
  return {
    id: proof.id,
    orderId: proof.orderId,
    channelId: proof.channelId,
    channelLabel: proof.channel?.label ?? null,
    amount: proof.amount,
    reference: proof.reference,
    slipUrl: proof.slipUrl,
    transferredAt: proof.transferredAt?.toISOString() ?? null,
    status: proof.status as PaymentProofStatus,
    reviewNote: proof.reviewNote,
    reviewedAt: proof.reviewedAt?.toISOString() ?? null,
    createdAt: proof.createdAt.toISOString(),
  };
}
