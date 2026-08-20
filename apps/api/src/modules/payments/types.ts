/**
 * Payment provider abstraction.
 *
 * Phase 1 deliberately ships only the `manual` provider — it records the intent
 * to pay and leaves the order as PENDING/PENDING so the creator can confirm the
 * transfer by hand. Real providers (Stripe, Omise/Opn, 2C2P, PromptPay,
 * ShopeePay, TrueMoney) implement the same interface and are registered in
 * `registry.ts`; nothing else in the codebase changes.
 */
export interface PaymentIntent {
  /** Provider-side reference stored on the order. */
  reference: string;
  status: 'REQUIRES_ACTION' | 'PENDING' | 'PAID' | 'FAILED';
  /** Where to send the buyer next, when the provider needs a hosted page. */
  redirectUrl?: string | null;
  /** Anything the storefront needs to render (QR payload, instructions, ...). */
  clientData?: Record<string, unknown>;
}

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  storeId: string;
  currency: string;
  /** Minor currency units. */
  amount: number;
  email: string;
  description: string;
  returnUrl: string;
}

export interface RefundInput {
  reference: string;
  amount: number;
  reason?: string;
}

export interface PaymentProvider {
  readonly key: string;
  readonly label: string;
  /** Shown in checkout to explain what happens after the buyer confirms. */
  readonly instructions: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentIntent>;
  getPayment(reference: string): Promise<PaymentIntent>;
  refund(input: RefundInput): Promise<{ refunded: boolean; reference: string }>;
}
