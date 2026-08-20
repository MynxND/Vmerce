import type { Prisma, PaymentProof, StorePaymentChannel } from '@prisma/client';
import { prisma } from '../config/prisma';

export type PaymentProofRow = PaymentProof & {
  channel: { id: string; label: string } | null;
};

const proofInclude = {
  channel: { select: { id: true, label: true } },
} satisfies Prisma.PaymentProofInclude;

export const paymentRepository = {
  listChannels(storeId: string, onlyEnabled = false): Promise<StorePaymentChannel[]> {
    return prisma.storePaymentChannel.findMany({
      where: { storeId, ...(onlyEnabled ? { enabled: true } : {}) },
      orderBy: [{ isDefault: 'desc' }, { position: 'asc' }, { createdAt: 'asc' }],
    });
  },

  findChannel(storeId: string, channelId: string): Promise<StorePaymentChannel | null> {
    return prisma.storePaymentChannel.findFirst({ where: { id: channelId, storeId } });
  },

  findDefaultChannel(storeId: string): Promise<StorePaymentChannel | null> {
    return prisma.storePaymentChannel.findFirst({
      where: { storeId, enabled: true },
      orderBy: [{ isDefault: 'desc' }, { position: 'asc' }],
    });
  },

  createChannel(
    data: Prisma.StorePaymentChannelUncheckedCreateInput,
  ): Promise<StorePaymentChannel> {
    return prisma.storePaymentChannel.create({ data });
  },

  updateChannel(
    channelId: string,
    data: Prisma.StorePaymentChannelUpdateInput,
  ): Promise<StorePaymentChannel> {
    return prisma.storePaymentChannel.update({ where: { id: channelId }, data });
  },

  deleteChannel(channelId: string): Promise<{ id: string }> {
    return prisma.storePaymentChannel.delete({ where: { id: channelId }, select: { id: true } });
  },

  /** Exactly one channel per store may be the default. */
  clearDefault(storeId: string, exceptId?: string, tx?: Prisma.TransactionClient) {
    return (tx ?? prisma).storePaymentChannel.updateMany({
      where: { storeId, isDefault: true, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      data: { isDefault: false },
    });
  },

  maxChannelPosition(storeId: string) {
    return prisma.storePaymentChannel.aggregate({ where: { storeId }, _max: { position: true } });
  },

  listProofs(orderId: string): Promise<PaymentProofRow[]> {
    return prisma.paymentProof.findMany({
      where: { orderId },
      include: proofInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  findProof(storeId: string, proofId: string) {
    return prisma.paymentProof.findFirst({
      where: { id: proofId, order: { storeId } },
      include: { ...proofInclude, order: { select: { id: true, storeId: true, total: true } } },
    });
  },

  countPendingProofs(orderId: string): Promise<number> {
    return prisma.paymentProof.count({ where: { orderId, status: 'PENDING' } });
  },

  createProof(data: Prisma.PaymentProofUncheckedCreateInput): Promise<PaymentProofRow> {
    return prisma.paymentProof.create({ data, include: proofInclude });
  },

  updateProof(
    proofId: string,
    data: Prisma.PaymentProofUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentProofRow> {
    return (tx ?? prisma).paymentProof.update({
      where: { id: proofId },
      data,
      include: proofInclude,
    });
  },

  /** Pending proofs across the whole store, for the dashboard's attention badge. */
  countPendingForStore(storeId: string): Promise<number> {
    return prisma.paymentProof.count({ where: { status: 'PENDING', order: { storeId } } });
  },
};
