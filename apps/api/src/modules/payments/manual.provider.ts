import type { CreatePaymentInput, PaymentIntent, PaymentProvider, RefundInput } from './types';

/**
 * Bank transfer / pay-on-confirmation. No external calls, no fake card
 * processing — the order simply waits for the creator to mark it paid.
 */
export const manualPaymentProvider: PaymentProvider = {
  key: 'manual',
  label: 'Bank transfer / manual confirmation',
  instructions:
    'Your order is reserved. The creator will send payment instructions to your email and confirm once payment clears.',

  async createPayment(input: CreatePaymentInput): Promise<PaymentIntent> {
    return {
      reference: `MANUAL-${input.orderNumber}`,
      status: 'PENDING',
      redirectUrl: null,
      clientData: { amount: input.amount, currency: input.currency },
    };
  },

  async getPayment(reference: string): Promise<PaymentIntent> {
    return { reference, status: 'PENDING' };
  },

  async refund(input: RefundInput) {
    return { refunded: true, reference: input.reference };
  },
};
