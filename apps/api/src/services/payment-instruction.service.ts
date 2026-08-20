import type { StorePaymentChannel } from '@prisma/client';
import { PaymentChannelType } from '@cc/types';
import type {
  PaymentChannelDto,
  PaymentInstructionDto,
  StorefrontPaymentChannelDto,
} from '@cc/types';
import {
  bankName,
  buildPromptPayPayload,
  maskIdentifier,
  type PromptPayProxyType,
} from '@cc/shared';
import { renderQrDataUri } from '../modules/payments/qr';
import { ApiError } from '../utils/errors';

/** Channel types that can be turned into a scannable, amount-bearing QR. */
const PROMPTPAY_PROXY: Partial<Record<PaymentChannelType, PromptPayProxyType>> = {
  [PaymentChannelType.PROMPTPAY_PHONE]: 'MOBILE',
  [PaymentChannelType.PROMPTPAY_NATIONAL_ID]: 'NATIONAL_ID',
  [PaymentChannelType.PROMPTPAY_EWALLET]: 'EWALLET',
};

export function channelSupportsQr(type: PaymentChannelType): boolean {
  return PROMPTPAY_PROXY[type] !== undefined || type === PaymentChannelType.CUSTOM_QR;
}

export function toPaymentChannelDto(channel: StorePaymentChannel): PaymentChannelDto {
  return {
    id: channel.id,
    storeId: channel.storeId,
    type: channel.type as PaymentChannelType,
    label: channel.label,
    accountName: channel.accountName,
    proxyValue: channel.proxyValue,
    bankCode: channel.bankCode,
    bankAccountNumber: channel.bankAccountNumber,
    qrImageUrl: channel.qrImageUrl,
    instructions: channel.instructions,
    enabled: channel.enabled,
    isDefault: channel.isDefault,
    position: channel.position,
    supportsQr: channelSupportsQr(channel.type as PaymentChannelType),
    createdAt: channel.createdAt.toISOString(),
  };
}

/**
 * Public view of a channel, shown at checkout before the buyer commits.
 *
 * Account identifiers are masked here: a visitor browsing checkout has no reason
 * to receive the creator's full phone number or account number, and the full
 * value is only released once an order exists.
 */
export function toStorefrontChannelDto(channel: StorePaymentChannel): StorefrontPaymentChannelDto {
  const type = channel.type as PaymentChannelType;
  return {
    id: channel.id,
    type,
    label: channel.label,
    accountName: channel.accountName,
    bankName: bankName(channel.bankCode),
    maskedIdentifier: maskIdentifier(channel.proxyValue ?? channel.bankAccountNumber),
    instructions: channel.instructions,
    supportsQr: channelSupportsQr(type),
  };
}

export interface BuildInstructionInput {
  channel: StorePaymentChannel;
  amount: number;
  currency: string;
  reference: string;
  storeName: string;
  expiresAt?: Date | null;
}

/**
 * Produces everything the buyer needs to pay: a QR encoding the exact amount
 * where the channel supports it, otherwise the account details as text.
 *
 * The result is snapshotted onto the order, so editing or deleting the channel
 * afterwards cannot change what an existing buyer was told to pay.
 */
export async function buildPaymentInstruction(
  input: BuildInstructionInput,
): Promise<PaymentInstructionDto> {
  const { channel, amount, currency, reference, storeName } = input;
  const type = channel.type as PaymentChannelType;

  let qrPayload: string | null = null;
  let qrImageUrl: string | null = null;

  const proxyType = PROMPTPAY_PROXY[type];
  if (proxyType) {
    if (!channel.proxyValue) {
      throw ApiError.badRequest(
        `Payment channel "${channel.label}" is missing its account details`,
      );
    }
    try {
      qrPayload = buildPromptPayPayload({
        proxyType,
        proxyValue: channel.proxyValue,
        amount,
        merchantName: storeName,
        reference,
      });
    } catch (error) {
      // A malformed stored proxy is a configuration problem, not a buyer error.
      throw ApiError.badRequest(
        error instanceof Error
          ? `Payment channel "${channel.label}": ${error.message}`
          : `Payment channel "${channel.label}" is misconfigured`,
      );
    }
    qrImageUrl = await renderQrDataUri(qrPayload);
  } else if (type === PaymentChannelType.CUSTOM_QR) {
    // A creator-supplied image cannot carry the amount, so the buyer types it.
    qrImageUrl = channel.qrImageUrl;
  }

  return {
    channelId: channel.id,
    channelType: type,
    label: channel.label,
    accountName: channel.accountName,
    bankName: bankName(channel.bankCode),
    identifier: channel.proxyValue ?? channel.bankAccountNumber,
    qrPayload,
    qrImageUrl,
    amount,
    currency,
    reference,
    instructions: channel.instructions,
    expiresAt: input.expiresAt?.toISOString() ?? null,
  };
}
