'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { checkoutSchema, formatMoney, type CheckoutInput } from '@cc/shared';
import type { StorefrontStoreDto } from '@cc/types';
import { useCart } from './cart-store';
import { storefrontApi, type CheckoutOptions } from './api';
import { errorMessage } from '@/lib/api-error';
import { storeUrl } from '@/lib/utils';

interface CheckoutFormProps {
  store: StorefrontStoreDto;
  options: CheckoutOptions;
}

const inputClass = 'storefront-chip w-full px-3 py-2.5 text-sm outline-none';

function FieldRow({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-xs font-medium" style={{ color: 'var(--store-accent)' }}>
          {error}
        </span>
      )}
    </label>
  );
}

export function CheckoutForm({ store, options }: CheckoutFormProps) {
  const router = useRouter();
  const { data: cart, isPending } = useCart(store.handle);

  const [shippingOptionId, setShippingOptionId] = React.useState(
    options.shippingOptions[0]?.id ?? '',
  );
  const [paymentChannelId, setPaymentChannelId] = React.useState(
    options.paymentChannels[0]?.id ?? '',
  );

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      cartToken: '',
      email: '',
      phone: '',
      shippingOptionId: options.shippingOptions[0]?.id ?? '',
      paymentChannelId: options.paymentChannels[0]?.id ?? null,
      paymentProvider: 'manual',
      note: '',
      acceptTerms: true,
      shippingAddress: {
        firstName: '',
        lastName: '',
        phone: '',
        line1: '',
        line2: '',
        district: '',
        province: '',
        postalCode: '',
        country: 'TH',
      },
    },
  });

  // The cart token is issued by the API; the form only carries it through.
  React.useEffect(() => {
    if (cart?.token) form.setValue('cartToken', cart.token);
  }, [cart?.token, form]);

  React.useEffect(() => {
    form.setValue('shippingOptionId', shippingOptionId);
    form.setValue('paymentChannelId', paymentChannelId || null);
  }, [shippingOptionId, paymentChannelId, form]);

  const shipping = options.shippingOptions.find((option) => option.id === shippingOptionId);
  const shippingAmount =
    cart?.discountCode && cart.shippingTotal === 0 ? 0 : (shipping?.amount ?? 0);
  const total = cart ? Math.max(0, cart.subtotal - cart.discountTotal + shippingAmount) : 0;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const order = await storefrontApi.checkout(store.handle, values);
      router.push(
        storeUrl(
          store.handle,
          `/orders/${order.orderNumber}?email=${encodeURIComponent(order.email)}`,
        ),
      );
    } catch (error) {
      toast.error(errorMessage(error, 'Could not place your order'));
    }
  });

  if (isPending) {
    return (
      <div className="storefront-container flex justify-center py-24">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="storefront-container py-24 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Nothing to check out</h1>
        <p className="storefront-muted mt-2 text-sm">Your cart is empty.</p>
        <Link
          href={storeUrl(store.handle, '/products')}
          className="storefront-button mt-7 inline-block px-5 py-2.5 text-sm font-semibold"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const addressErrors = form.formState.errors.shippingAddress;

  return (
    <form onSubmit={onSubmit} className="storefront-container py-12" noValidate>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">Contact</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow
                label="Email"
                error={form.formState.errors.email?.message}
                className="sm:col-span-2"
              >
                <input
                  type="email"
                  autoComplete="email"
                  className={inputClass}
                  {...form.register('email')}
                />
              </FieldRow>
              <FieldRow label="Phone" error={form.formState.errors.phone?.message}>
                <input
                  type="tel"
                  autoComplete="tel"
                  className={inputClass}
                  {...form.register('phone')}
                />
              </FieldRow>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Shipping address
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="First name" error={addressErrors?.firstName?.message}>
                <input
                  autoComplete="given-name"
                  className={inputClass}
                  {...form.register('shippingAddress.firstName')}
                />
              </FieldRow>
              <FieldRow label="Last name" error={addressErrors?.lastName?.message}>
                <input
                  autoComplete="family-name"
                  className={inputClass}
                  {...form.register('shippingAddress.lastName')}
                />
              </FieldRow>
              <FieldRow
                label="Address"
                error={addressErrors?.line1?.message}
                className="sm:col-span-2"
              >
                <input
                  autoComplete="address-line1"
                  className={inputClass}
                  {...form.register('shippingAddress.line1')}
                />
              </FieldRow>
              <FieldRow label="Apartment, building (optional)" className="sm:col-span-2">
                <input
                  autoComplete="address-line2"
                  className={inputClass}
                  {...form.register('shippingAddress.line2')}
                />
              </FieldRow>
              <FieldRow label="District" error={addressErrors?.district?.message}>
                <input
                  autoComplete="address-level3"
                  className={inputClass}
                  {...form.register('shippingAddress.district')}
                />
              </FieldRow>
              <FieldRow label="Province" error={addressErrors?.province?.message}>
                <input
                  autoComplete="address-level1"
                  className={inputClass}
                  {...form.register('shippingAddress.province')}
                />
              </FieldRow>
              <FieldRow label="Postal code" error={addressErrors?.postalCode?.message}>
                <input
                  autoComplete="postal-code"
                  className={inputClass}
                  {...form.register('shippingAddress.postalCode')}
                />
              </FieldRow>
              <FieldRow label="Country" error={addressErrors?.country?.message}>
                <input
                  autoComplete="country"
                  maxLength={2}
                  className={inputClass}
                  {...form.register('shippingAddress.country')}
                />
              </FieldRow>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">Shipping method</h2>
            <div className="space-y-2.5">
              {options.shippingOptions.map((option) => (
                <label
                  key={option.id}
                  data-selected={option.id === shippingOptionId}
                  className="storefront-chip flex cursor-pointer items-center gap-3 p-3.5"
                >
                  <input
                    type="radio"
                    name="shippingOption"
                    value={option.id}
                    checked={option.id === shippingOptionId}
                    onChange={() => setShippingOptionId(option.id)}
                    className="accent-[var(--store-primary)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="storefront-muted block text-xs">
                      {option.description} · {option.estimatedDays}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium">
                    {option.amount === 0
                      ? 'Free'
                      : formatMoney(option.amount, { currency: cart.currency })}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">Payment</h2>

            {options.paymentChannels.length === 0 ? (
              <p className="storefront-muted text-sm">
                This shop has not set up a payment method yet. You can still place your order and
                the creator will email you instructions.
              </p>
            ) : (
              <div className="space-y-2.5">
                {options.paymentChannels.map((channel) => (
                  <label
                    key={channel.id}
                    data-selected={channel.id === paymentChannelId}
                    className="storefront-chip flex cursor-pointer items-start gap-3 p-3.5"
                  >
                    <input
                      type="radio"
                      name="paymentChannel"
                      value={channel.id}
                      checked={channel.id === paymentChannelId}
                      onChange={() => setPaymentChannelId(channel.id)}
                      className="mt-0.5 accent-[var(--store-primary)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{channel.label}</span>
                        {channel.supportsQr && (
                          <span
                            className="px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide"
                            style={{
                              backgroundColor:
                                'color-mix(in oklab, var(--store-primary) 14%, transparent)',
                              borderRadius: 'var(--store-button-radius)',
                            }}
                          >
                            QR
                          </span>
                        )}
                      </span>
                      <span className="storefront-muted block text-xs">
                        {channel.accountName}
                        {channel.bankName && ` · ${channel.bankName}`}
                        {channel.maskedIdentifier && ` · ${channel.maskedIdentifier}`}
                      </span>
                      {channel.instructions && (
                        <span className="storefront-muted mt-1 block text-xs leading-relaxed">
                          {channel.instructions}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <p className="storefront-muted mt-3 text-xs leading-relaxed">
              You will see a QR and the exact amount on the next screen. Nothing is charged
              automatically and no card details are collected.
            </p>
          </section>

          <section>
            <FieldRow label="Order note (optional)">
              <textarea rows={3} className={inputClass} {...form.register('note')} />
            </FieldRow>
          </section>
        </div>

        <aside className="storefront-surface h-fit p-6 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Order summary</h2>

          <ul className="mt-4 space-y-3">
            {cart.items.map((item) => (
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
                  <span className="storefront-muted block truncate text-xs">
                    {item.variantTitle}
                  </span>
                  <span className="storefront-muted block text-xs">Qty {item.quantity}</span>
                </span>
                <span className="shrink-0 text-sm">
                  {formatMoney(item.lineTotal, { currency: cart.currency })}
                </span>
              </li>
            ))}
          </ul>

          <dl
            className="mt-5 space-y-2.5 pt-5 text-sm"
            style={{ borderTop: '1px solid var(--store-border)' }}
          >
            <div className="flex justify-between">
              <dt className="storefront-muted">Subtotal</dt>
              <dd>{formatMoney(cart.subtotal, { currency: cart.currency })}</dd>
            </div>
            {cart.discountTotal > 0 && (
              <div className="flex justify-between">
                <dt className="storefront-muted">Discount ({cart.discountCode})</dt>
                <dd>−{formatMoney(cart.discountTotal, { currency: cart.currency })}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="storefront-muted">Shipping</dt>
              <dd>
                {shippingAmount === 0
                  ? 'Free'
                  : formatMoney(shippingAmount, { currency: cart.currency })}
              </dd>
            </div>
            <div
              className="flex justify-between pt-3 text-base font-semibold"
              style={{ borderTop: '1px solid var(--store-border)' }}
            >
              <dt>Total</dt>
              <dd>{formatMoney(total, { currency: cart.currency })}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="storefront-button mt-6 w-full py-3.5 text-sm font-semibold disabled:opacity-60"
          >
            {form.formState.isSubmitting ? 'Placing order…' : 'Place order'}
          </button>

          <p className="storefront-muted mt-3 flex items-center justify-center gap-1.5 text-xs">
            <Lock className="size-3" />
            No card details are collected in this build.
          </p>
        </aside>
      </div>
    </form>
  );
}
