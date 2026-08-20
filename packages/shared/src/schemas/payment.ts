import { z } from 'zod';
import { PaymentChannelType } from '@cc/types';
import { THAI_BANKS } from '../banks';
import { formMoneySchema } from './common';

const bankCodeSchema = z
  .string()
  .trim()
  .refine((code) => THAI_BANKS.some((bank) => bank.code === code), 'Choose a bank from the list');

/**
 * Payment channels a creator can accept money through.
 *
 * Which fields are required depends on the channel type, so the shape is
 * validated in a refinement rather than by a discriminated union — the dashboard
 * form keeps one flat draft object and this keeps the API forgiving about the
 * fields that do not apply.
 */
const basePaymentChannelSchema = z.object({
  type: z.nativeEnum(PaymentChannelType),
  label: z.string().trim().min(2, 'At least 2 characters').max(60),
  accountName: z.string().trim().min(2, 'Who receives the money?').max(120),
  /** Phone number, national/tax ID, or e-wallet id, depending on `type`. */
  proxyValue: z
    .string()
    .trim()
    .max(40)
    .nullish()
    .transform((value) => value ?? null),
  bankCode: bankCodeSchema.nullish().transform((value) => value ?? null),
  bankAccountNumber: z
    .string()
    .trim()
    .max(30)
    .nullish()
    .transform((value) => value ?? null),
  qrImageUrl: z
    .string()
    .trim()
    .max(2048)
    .nullish()
    .transform((value) => value ?? null),
  instructions: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => value ?? null),
  enabled: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type ChannelShape = z.infer<typeof basePaymentChannelSchema>;

const PROXY_RULES: Partial<
  Record<PaymentChannelType, { label: string; test: (digits: string) => boolean }>
> = {
  [PaymentChannelType.PROMPTPAY_PHONE]: {
    label: 'Enter a Thai mobile number, e.g. 0812345678',
    test: (digits) => digits.replace(/^66/, '').replace(/^0+/, '').length === 9,
  },
  [PaymentChannelType.PROMPTPAY_NATIONAL_ID]: {
    label: 'A national ID or tax ID has 13 digits',
    test: (digits) => digits.length === 13,
  },
  [PaymentChannelType.PROMPTPAY_EWALLET]: {
    label: 'An e-wallet ID has 15 digits',
    test: (digits) => digits.length === 15,
  },
};

function validateChannel(data: Partial<ChannelShape>, ctx: z.RefinementCtx): void {
  if (!data.type) return;

  const rule = PROXY_RULES[data.type];
  if (rule) {
    const digits = (data.proxyValue ?? '').replace(/\D/g, '');
    if (!digits) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['proxyValue'], message: 'Required' });
    } else if (!rule.test(digits)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['proxyValue'], message: rule.label });
    }
  }

  if (data.type === PaymentChannelType.BANK_TRANSFER) {
    if (!data.bankCode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bankCode'], message: 'Choose a bank' });
    }
    const account = (data.bankAccountNumber ?? '').replace(/\D/g, '');
    if (account.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bankAccountNumber'],
        message: 'Enter the full account number',
      });
    }
  }

  if (data.type === PaymentChannelType.CUSTOM_QR && !data.qrImageUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['qrImageUrl'],
      message: 'Upload your QR image',
    });
  }
}

export const createPaymentChannelSchema = basePaymentChannelSchema.superRefine(validateChannel);
export type CreatePaymentChannelInput = z.infer<typeof createPaymentChannelSchema>;

export const updatePaymentChannelSchema = basePaymentChannelSchema
  .partial()
  .superRefine((data, ctx) => {
    // Only re-check the type-specific rules when the type itself is in play;
    // a partial update that just flips `enabled` should not demand every field.
    if (data.type !== undefined) validateChannel(data, ctx);
  });
export type UpdatePaymentChannelInput = z.infer<typeof updatePaymentChannelSchema>;

export const reorderPaymentChannelsSchema = z.object({
  ids: z.array(z.string()).min(1),
});

/**
 * Buyer-submitted proof that they transferred the money.
 *
 * Sent as `multipart/form-data` alongside the slip image, so numeric and date
 * fields arrive as strings and are coerced.
 */
export const submitPaymentProofSchema = z.object({
  /** Order lookup is by number plus the email it was placed with. */
  email: z.string().trim().toLowerCase().email(),
  amount: formMoneySchema,
  reference: z
    .string()
    .trim()
    .max(80)
    .nullish()
    .transform((value) => value ?? null),
  transferredAt: z
    .string()
    .datetime({ offset: true })
    .nullish()
    .transform((value) => value ?? null),
});
export type SubmitPaymentProofInput = z.infer<typeof submitPaymentProofSchema>;

export const reviewPaymentProofSchema = z.object({
  approve: z.boolean(),
  note: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => value ?? null),
});
export type ReviewPaymentProofInput = z.infer<typeof reviewPaymentProofSchema>;
