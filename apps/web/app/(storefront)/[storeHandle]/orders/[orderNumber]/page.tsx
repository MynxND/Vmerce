import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { formatMoney } from '@cc/shared';
import { storefrontServer } from '@/features/storefront/api';
import { PaymentPanel } from '@/features/storefront/payment-panel';
import { normalizeHandleParam, storeUrl } from '@/lib/utils';

export const metadata: Metadata = { title: 'Order confirmed' };

/**
 * Public order confirmation.
 *
 * Access needs both the order number and the email it was placed with, so an
 * order number alone cannot be used to read someone's address or their payment
 * instructions.
 */
export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeHandle: string; orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { storeHandle, orderNumber } = await params;
  const { email } = await searchParams;
  const handle = normalizeHandleParam(storeHandle);

  if (!email) notFound();

  const [store, view] = await Promise.all([
    storefrontServer.storeOptional(handle),
    storefrontServer.order(handle, orderNumber, email),
  ]);
  if (!store || !view) notFound();

  const { order, instruction, proofs } = view;
  const awaitingPayment = order.paymentStatus !== 'PAID';

  return (
    <div className="storefront-container max-w-2xl py-16">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-10" style={{ color: 'var(--store-primary)' }} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Thank you!</h1>
        <p className="storefront-muted mt-2 text-sm">
          Order <span className="font-mono font-semibold">{order.orderNumber}</span> is placed.{' '}
          {awaitingPayment
            ? 'Complete the transfer below to confirm it.'
            : `A receipt is on its way to ${order.email}.`}
        </p>
      </div>

      {/* Payment sits first: while unpaid it is the buyer's next action, and once
          paid it is the reassurance they came back to check. */}
      <PaymentPanel
        handle={handle}
        order={order}
        // Props of a client component are serialised into the page payload even
        // when unused, so a paid order should not ship the QR and the creator's
        // full account number along with it.
        instruction={awaitingPayment ? instruction : null}
        proofs={awaitingPayment ? proofs : []}
      />

      <div className="storefront-surface mt-5 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider">What you ordered</h2>

        <ul className="mt-4 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span
                className="size-14 shrink-0 overflow-hidden"
                style={{
                  backgroundColor: 'var(--store-border)',
                  borderRadius: 'var(--store-radius)',
                }}
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="size-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.productTitle}</span>
                <span className="storefront-muted block truncate text-xs">{item.variantTitle}</span>
                <span className="storefront-muted block text-xs">Qty {item.quantity}</span>
              </span>
              <span className="shrink-0 text-sm">
                {formatMoney(item.lineTotal, { currency: order.currency })}
              </span>
            </li>
          ))}
        </ul>

        <dl
          className="mt-5 space-y-2 pt-5 text-sm"
          style={{ borderTop: '1px solid var(--store-border)' }}
        >
          <div className="flex justify-between">
            <dt className="storefront-muted">Subtotal</dt>
            <dd>{formatMoney(order.subtotal, { currency: order.currency })}</dd>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between">
              <dt className="storefront-muted">Discount</dt>
              <dd>−{formatMoney(order.discountTotal, { currency: order.currency })}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="storefront-muted">Shipping · {order.shippingMethod}</dt>
            <dd>{formatMoney(order.shippingTotal, { currency: order.currency })}</dd>
          </div>
          <div
            className="flex justify-between pt-3 text-base font-semibold"
            style={{ borderTop: '1px solid var(--store-border)' }}
          >
            <dt>Total</dt>
            <dd>{formatMoney(order.total, { currency: order.currency })}</dd>
          </div>
        </dl>
      </div>

      {order.shippingAddress && (
        <div className="storefront-surface mt-5 p-6 text-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Shipping to</h2>
          <p className="mt-3 font-medium">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
          </p>
          <p className="storefront-muted">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
          </p>
          <p className="storefront-muted">
            {[order.shippingAddress.district, order.shippingAddress.province]
              .filter(Boolean)
              .join(', ')}{' '}
            {order.shippingAddress.postalCode} {order.shippingAddress.country}
          </p>
        </div>
      )}

      <p className="storefront-muted mt-6 text-center text-xs">
        Bookmark this page to check your order status, or reopen it from the link in your email.
      </p>

      <div className="mt-6 text-center">
        <Link
          href={storeUrl(store.handle, '/products')}
          className="storefront-button-outline px-5 py-2.5 text-sm font-medium"
        >
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
