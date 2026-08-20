import { OrderStatus, PaymentStatus, PaymentProofStatus } from '@cc/types';
import type { OrderDto, PaymentProofDto } from '@cc/types';
import type { ReviewPaymentProofInput, SubmitPaymentProofInput } from '@cc/shared';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { orderRepository } from '../repositories/order.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { storeRepository } from '../repositories/store.repository';
import { toPaymentProofDto } from '../mappers/payment.mapper';
import { toOrderDto } from '../mappers/order.mapper';
import { getStorageDriver } from '../modules/storage/index';
import { ApiError } from '../utils/errors';

/** Only these states are still waiting for money. */
const AWAITING_PAYMENT: PaymentStatus[] = [PaymentStatus.PENDING, PaymentStatus.FAILED];

export const paymentProofService = {
  /**
   * Buyer-side slip upload.
   *
   * Access is by order number plus the email the order was placed with — the
   * same pair the confirmation page already requires — so an order number on its
   * own is not enough to attach anything to someone else's order.
   */
  async submit(
    storeHandle: string,
    orderNumber: string,
    input: SubmitPaymentProofInput,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<PaymentProofDto> {
    const store = await storeRepository.findByHandle(storeHandle);
    if (!store || store.status !== 'ACTIVE') {
      throw ApiError.notFound('Store not found', 'STORE_NOT_FOUND');
    }

    const order = await orderRepository.findByNumber(store.id, orderNumber);
    if (!order || order.email.toLowerCase() !== input.email.toLowerCase()) {
      throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw ApiError.badRequest('This order is already marked as paid');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw ApiError.badRequest('This order was cancelled');
    }

    const pending = await paymentRepository.countPendingProofs(order.id);
    // One open submission at a time keeps the creator's review queue honest.
    if (pending > 0) {
      throw ApiError.conflict('You already have a slip awaiting review for this order');
    }

    const stored = await getStorageDriver().put({
      storeId: store.id,
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    const proof = await paymentRepository.createProof({
      orderId: order.id,
      channelId: order.paymentChannelId,
      amount: input.amount,
      reference: input.reference,
      slipKey: stored.key,
      slipUrl: stored.url,
      transferredAt: input.transferredAt ? new Date(input.transferredAt) : null,
      status: PaymentProofStatus.PENDING,
    });

    logger.info(`Payment slip submitted for order ${order.orderNumber} on store ${store.handle}`);
    return toPaymentProofDto(proof);
  },

  async listForOrder(storeId: string, orderId: string): Promise<PaymentProofDto[]> {
    const order = await orderRepository.findById(storeId, orderId);
    if (!order) throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND');

    const proofs = await paymentRepository.listProofs(orderId);
    return proofs.map(toPaymentProofDto);
  },

  /**
   * Creator-side review.
   *
   * Approving is what actually marks an order paid — there is no gateway webhook
   * behind a bank transfer, so a human decision is the source of truth. The
   * amount the buyer claims is *not* trusted: the order total is what gets
   * recorded, and a mismatch is surfaced to the reviewer instead.
   */
  async review(
    storeId: string,
    proofId: string,
    reviewerId: string,
    input: ReviewPaymentProofInput,
  ): Promise<{ proof: PaymentProofDto; order: OrderDto }> {
    const proof = await paymentRepository.findProof(storeId, proofId);
    if (!proof) throw ApiError.notFound('Payment slip not found');
    if (proof.status !== PaymentProofStatus.PENDING) {
      throw ApiError.badRequest('That slip has already been reviewed');
    }

    const orderId = proof.orderId;

    await prisma.$transaction(async (tx) => {
      await paymentRepository.updateProof(
        proofId,
        {
          status: input.approve ? PaymentProofStatus.APPROVED : PaymentProofStatus.REJECTED,
          reviewNote: input.note,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
        tx,
      );

      if (!input.approve) return;

      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { paymentStatus: true, status: true },
      });

      if (AWAITING_PAYMENT.includes(order.paymentStatus as PaymentStatus)) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            // Only advance a still-pending order; do not walk back a shipped one.
            ...(order.status === OrderStatus.PENDING ? { status: OrderStatus.CONFIRMED } : {}),
          },
        });
      }
    });

    const [freshProof, freshOrder] = await Promise.all([
      paymentRepository.findProof(storeId, proofId),
      orderRepository.findById(storeId, orderId),
    ]);

    if (!freshProof || !freshOrder) throw ApiError.internal();

    return { proof: toPaymentProofDto(freshProof), order: toOrderDto(freshOrder) };
  },

  countPending(storeId: string): Promise<number> {
    return paymentRepository.countPendingForStore(storeId);
  },
};
