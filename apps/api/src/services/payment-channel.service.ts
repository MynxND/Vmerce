import type { Prisma } from '@prisma/client';
import { PaymentChannelType } from '@cc/types';
import type { PaymentChannelDto, StorefrontPaymentChannelDto } from '@cc/types';
import type { CreatePaymentChannelInput, UpdatePaymentChannelInput } from '@cc/shared';
import { prisma } from '../config/prisma';
import { paymentRepository } from '../repositories/payment.repository';
import { ApiError } from '../utils/errors';
import { toPaymentChannelDto, toStorefrontChannelDto } from './payment-instruction.service';

/**
 * Fields that only apply to some channel types are blanked out on write, so a
 * channel switched from bank transfer to PromptPay does not keep a stale account
 * number that the storefront might then display.
 */
function normalizeForType(
  type: PaymentChannelType,
  input: Partial<CreatePaymentChannelInput>,
): Pick<CreatePaymentChannelInput, 'proxyValue' | 'bankCode' | 'bankAccountNumber' | 'qrImageUrl'> {
  const isPromptPay =
    type === PaymentChannelType.PROMPTPAY_PHONE ||
    type === PaymentChannelType.PROMPTPAY_NATIONAL_ID ||
    type === PaymentChannelType.PROMPTPAY_EWALLET;

  return {
    // Store digits only: the payload builder needs them and display formatting
    // is the UI's job.
    proxyValue: isPromptPay ? (input.proxyValue ?? '').replace(/\D/g, '') || null : null,
    bankCode: type === PaymentChannelType.BANK_TRANSFER ? (input.bankCode ?? null) : null,
    bankAccountNumber:
      type === PaymentChannelType.BANK_TRANSFER
        ? (input.bankAccountNumber ?? '').replace(/\D/g, '') || null
        : null,
    qrImageUrl: type === PaymentChannelType.CUSTOM_QR ? (input.qrImageUrl ?? null) : null,
  };
}

export const paymentChannelService = {
  async list(storeId: string): Promise<PaymentChannelDto[]> {
    const channels = await paymentRepository.listChannels(storeId);
    return channels.map(toPaymentChannelDto);
  },

  /** Enabled channels only, masked, for the public checkout. */
  async listForStorefront(storeId: string): Promise<StorefrontPaymentChannelDto[]> {
    const channels = await paymentRepository.listChannels(storeId, true);
    return channels
      .filter((channel) => {
        // Never offer a channel that cannot actually be paid into.
        if (channel.type === PaymentChannelType.CUSTOM_QR) return Boolean(channel.qrImageUrl);
        if (channel.type === PaymentChannelType.BANK_TRANSFER) {
          return Boolean(channel.bankCode && channel.bankAccountNumber);
        }
        return Boolean(channel.proxyValue);
      })
      .map(toStorefrontChannelDto);
  },

  async getById(storeId: string, channelId: string): Promise<PaymentChannelDto> {
    const channel = await paymentRepository.findChannel(storeId, channelId);
    if (!channel) throw ApiError.notFound('Payment channel not found');
    return toPaymentChannelDto(channel);
  },

  async create(storeId: string, input: CreatePaymentChannelInput): Promise<PaymentChannelDto> {
    const existing = await paymentRepository.listChannels(storeId);
    if (existing.some((channel) => channel.label.toLowerCase() === input.label.toLowerCase())) {
      throw ApiError.conflict('You already have a payment method with that name');
    }

    const maxPosition = await paymentRepository.maxChannelPosition(storeId);
    // The very first channel becomes the default whether or not it was asked for.
    const isDefault = input.isDefault || existing.length === 0;

    const channel = await prisma.$transaction(async (tx) => {
      if (isDefault) await paymentRepository.clearDefault(storeId, undefined, tx);

      return tx.storePaymentChannel.create({
        data: {
          storeId,
          type: input.type,
          label: input.label,
          accountName: input.accountName,
          instructions: input.instructions,
          enabled: input.enabled,
          isDefault,
          position: (maxPosition._max.position ?? -1) + 1,
          ...normalizeForType(input.type, input),
        },
      });
    });

    return toPaymentChannelDto(channel);
  },

  async update(
    storeId: string,
    channelId: string,
    input: UpdatePaymentChannelInput,
  ): Promise<PaymentChannelDto> {
    const existing = await paymentRepository.findChannel(storeId, channelId);
    if (!existing) throw ApiError.notFound('Payment channel not found');

    const type = (input.type ?? existing.type) as PaymentChannelType;

    const data: Prisma.StorePaymentChannelUpdateInput = {};
    if (input.label !== undefined) data.label = input.label;
    if (input.accountName !== undefined) data.accountName = input.accountName;
    if (input.instructions !== undefined) data.instructions = input.instructions;
    if (input.enabled !== undefined) data.enabled = input.enabled;

    // Re-normalise whenever the type changes or any type-specific field is sent.
    const touchesDetails =
      input.type !== undefined ||
      input.proxyValue !== undefined ||
      input.bankCode !== undefined ||
      input.bankAccountNumber !== undefined ||
      input.qrImageUrl !== undefined;

    if (touchesDetails) {
      data.type = type;
      Object.assign(
        data,
        normalizeForType(type, {
          proxyValue: input.proxyValue ?? existing.proxyValue,
          bankCode: input.bankCode ?? existing.bankCode,
          bankAccountNumber: input.bankAccountNumber ?? existing.bankAccountNumber,
          qrImageUrl: input.qrImageUrl ?? existing.qrImageUrl,
        }),
      );
    }

    const channel = await prisma.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await paymentRepository.clearDefault(storeId, channelId, tx);
        data.isDefault = true;
      } else if (input.isDefault === false && existing.isDefault) {
        // Refuse to leave a store with no default while other channels exist.
        const others = await tx.storePaymentChannel.count({
          where: { storeId, NOT: { id: channelId }, enabled: true },
        });
        if (others > 0) {
          throw ApiError.badRequest('Pick another payment method as the default first');
        }
        data.isDefault = false;
      }

      return tx.storePaymentChannel.update({ where: { id: channelId }, data });
    });

    return toPaymentChannelDto(channel);
  },

  async remove(storeId: string, channelId: string): Promise<void> {
    const existing = await paymentRepository.findChannel(storeId, channelId);
    if (!existing) throw ApiError.notFound('Payment channel not found');

    await prisma.$transaction(async (tx) => {
      await tx.storePaymentChannel.delete({ where: { id: channelId } });

      // Promote another channel so the store keeps a usable default.
      if (existing.isDefault) {
        const next = await tx.storePaymentChannel.findFirst({
          where: { storeId, enabled: true },
          orderBy: { position: 'asc' },
        });
        if (next) {
          await tx.storePaymentChannel.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });
  },

  async reorder(storeId: string, ids: string[]): Promise<void> {
    const owned = await paymentRepository.listChannels(storeId);
    const ownedIds = new Set(owned.map((channel) => channel.id));

    await prisma.$transaction(
      ids
        .filter((id) => ownedIds.has(id))
        .map((id, index) =>
          prisma.storePaymentChannel.update({ where: { id }, data: { position: index } }),
        ),
    );
  },

  /** Resolves the channel a checkout should use, falling back to the default. */
  async resolveForCheckout(storeId: string, channelId: string | null | undefined) {
    if (channelId) {
      const channel = await paymentRepository.findChannel(storeId, channelId);
      if (!channel || !channel.enabled) {
        throw ApiError.badRequest('That payment method is not available', 'UNSUPPORTED_PROVIDER');
      }
      return channel;
    }
    return paymentRepository.findDefaultChannel(storeId);
  },
};
