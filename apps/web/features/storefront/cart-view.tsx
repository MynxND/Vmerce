'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { formatMoney } from '@cc/shared';
import type { StorefrontStoreDto } from '@cc/types';
import { useCart, useCartMutations } from './cart-store';
import { storeUrl } from '@/lib/utils';

export function CartView({ store }: { store: StorefrontStoreDto }) {
  const { data: cart, isPending } = useCart(store.handle);
  const { updateItem, removeItem, applyDiscount } = useCartMutations(store.handle);
  const [code, setCode] = React.useState('');

  if (isPending) {
    return (
      <div className="storefront-container flex justify-center py-24">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="storefront-container flex flex-col items-center py-24 text-center">
        <ShoppingBag className="size-8" style={{ color: 'var(--store-muted)' }} />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="storefront-muted mt-2 text-sm">
          Add something you like and it will show up here.
        </p>
        <Link
          href={storeUrl(store.handle, '/products')}
          className="storefront-button mt-7 px-5 py-2.5 text-sm font-semibold"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const busy = updateItem.isPending || removeItem.isPending;

  return (
    <div className="storefront-container py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <ul className="space-y-5">
          {cart.items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 pb-5"
              style={{ borderBottom: '1px solid var(--store-border)' }}
            >
              <Link
                href={storeUrl(store.handle, `/products/${item.productSlug}`)}
                className="size-24 shrink-0 overflow-hidden"
                style={{
                  backgroundColor: 'var(--store-border)',
                  borderRadius: 'var(--store-radius)',
                }}
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="size-full object-cover" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={storeUrl(store.handle, `/products/${item.productSlug}`)}
                  className="block truncate font-medium hover:opacity-70"
                >
                  {item.productTitle}
                </Link>
                <p className="storefront-muted truncate text-sm">{item.variantTitle}</p>
                {!item.available && (
                  <p className="mt-1 text-sm font-medium" style={{ color: 'var(--store-accent)' }}>
                    No longer available — remove to check out
                  </p>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <div className="storefront-chip flex items-center">
                    <button
                      type="button"
                      className="px-2.5 py-1.5 disabled:opacity-40"
                      disabled={busy || item.quantity <= 1}
                      onClick={() =>
                        updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                      }
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-7 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="px-2.5 py-1.5 disabled:opacity-40"
                      disabled={busy}
                      onClick={() =>
                        updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="storefront-muted text-sm hover:opacity-70 disabled:opacity-40"
                    disabled={busy}
                    onClick={() => removeItem.mutate(item.id)}
                  >
                    <Trash2 className="mr-1 inline size-3.5" />
                    Remove
                  </button>
                </div>
              </div>

              <p className="shrink-0 font-medium">
                {formatMoney(item.lineTotal, { currency: cart.currency })}
              </p>
            </li>
          ))}
        </ul>

        <aside className="storefront-surface h-fit p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Summary</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
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
              <dd className="storefront-muted">Calculated at checkout</dd>
            </div>
            <div
              className="flex justify-between pt-3 text-base font-semibold"
              style={{ borderTop: '1px solid var(--store-border)' }}
            >
              <dt>Total</dt>
              <dd>{formatMoney(cart.total, { currency: cart.currency })}</dd>
            </div>
          </dl>

          <div className="mt-5">
            {cart.discountCode ? (
              <button
                type="button"
                className="storefront-muted text-sm underline hover:no-underline"
                onClick={() => applyDiscount.mutate(null)}
              >
                Remove discount code
              </button>
            ) : (
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (code.trim()) applyDiscount.mutate(code.trim().toUpperCase());
                }}
              >
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Discount code"
                  aria-label="Discount code"
                  className="storefront-chip flex-1 px-3 py-2 text-sm outline-none"
                />
                <button
                  type="submit"
                  className="storefront-button-outline px-3.5 py-2 text-sm font-medium"
                  disabled={applyDiscount.isPending}
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          <Link
            href={storeUrl(store.handle, '/checkout')}
            className="storefront-button mt-6 block py-3.5 text-center text-sm font-semibold"
          >
            Checkout
          </Link>

          <Link
            href={storeUrl(store.handle, '/products')}
            className="storefront-muted mt-3 block text-center text-sm hover:opacity-70"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
