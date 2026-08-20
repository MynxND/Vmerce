'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { formatMoney } from '@cc/shared';
import { InventoryMode } from '@cc/types';
import type { ProductDto, ProductListItemDto, StorefrontStoreDto } from '@cc/types';
import { ProductCard } from './product-card';
import { VariantSelector, initialSelection, type VariantSelection } from './variant-selector';
import { useCartMutations } from './cart-store';
import { storeUrl } from '@/lib/utils';

interface ProductDetailProps {
  store: StorefrontStoreDto;
  product: ProductDto;
  related: ProductListItemDto[];
}

export function ProductDetail({ store, product, related }: ProductDetailProps) {
  const router = useRouter();
  const { addItem } = useCartMutations(store.handle);

  const [selection, setSelection] = React.useState<VariantSelection>(() =>
    initialSelection(product.options, product.variants),
  );
  const [quantity, setQuantity] = React.useState(1);
  const [activeImage, setActiveImage] = React.useState(0);

  const variant = selection.variant;
  const price = variant?.price ?? product.price;
  const compareAt = variant?.compareAtPrice ?? product.compareAtPrice;
  const tracked = product.inventoryMode === InventoryMode.TRACKED;
  const soldOut = Boolean(variant && tracked && variant.stock <= 0);
  const images = product.media.length > 0 ? product.media : [];

  async function addToCart(thenGoToCart: boolean) {
    if (!variant) return;
    await addItem.mutateAsync({ variantId: variant.id, quantity });
    if (thenGoToCart) router.push(storeUrl(store.handle, '/cart'));
  }

  return (
    <div className="storefront-container py-10">
      <nav className="storefront-muted mb-6 text-sm">
        <Link href={storeUrl(store.handle)} className="hover:opacity-70">
          {store.name}
        </Link>
        <span className="mx-2">/</span>
        <Link href={storeUrl(store.handle, '/products')} className="hover:opacity-70">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span>{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div
            className="aspect-square overflow-hidden"
            style={{ backgroundColor: 'var(--store-border)', borderRadius: 'var(--store-radius)' }}
          >
            {(variant?.imageUrl ?? images[activeImage]?.url) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={variant?.imageUrl ?? images[activeImage]?.url}
                alt={product.title}
                className="size-full object-cover"
              />
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((media, index) => (
                <button
                  key={media.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  data-selected={index === activeImage}
                  className="storefront-chip size-16 shrink-0 overflow-hidden p-0"
                  aria-label={`Image ${index + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.url} alt="" className="size-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{product.title}</h1>

          <p className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-semibold">
              {formatMoney(price, { currency: product.currency })}
            </span>
            {compareAt !== null && compareAt > price && (
              <span className="storefront-muted text-base line-through">
                {formatMoney(compareAt, { currency: product.currency })}
              </span>
            )}
          </p>

          {product.options.length > 0 && (
            <div className="mt-8">
              <VariantSelector
                options={product.options}
                variants={product.variants}
                selection={selection}
                onChange={(next) => {
                  setSelection(next);
                  setQuantity(1);
                }}
              />
            </div>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="storefront-chip flex items-center">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="px-3 py-2.5 disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-8 text-center text-sm font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(99, current + 1))}
                className="px-3 py-2.5"
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>

            {tracked && variant && variant.stock > 0 && variant.stock <= 10 && (
              <p className="text-sm font-medium" style={{ color: 'var(--store-accent)' }}>
                Only {variant.stock} left
              </p>
            )}
          </div>

          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              disabled={!variant || soldOut || addItem.isPending}
              onClick={() => void addToCart(false)}
              className="storefront-button w-full py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {soldOut ? 'Sold out' : !variant ? 'Choose your options' : 'Add to cart'}
            </button>

            <button
              type="button"
              disabled={!variant || soldOut || addItem.isPending}
              onClick={() => void addToCart(true)}
              className="storefront-button-outline w-full py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy it now
            </button>
          </div>

          {variant?.sku && (
            <p className="storefront-muted mt-4 font-mono text-xs">SKU {variant.sku}</p>
          )}

          {product.description && (
            <div className="mt-8" style={{ borderTop: '1px solid var(--store-border)' }}>
              <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider">Details</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <Truck className="size-5 shrink-0" style={{ color: 'var(--store-primary)' }} />
              <div>
                <dt className="text-sm font-medium">Shipping</dt>
                <dd className="storefront-muted text-sm">
                  Tracked delivery in 3-5 business days. Local pickup available at checkout.
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0" style={{ color: 'var(--store-primary)' }} />
              <div>
                <dt className="text-sm font-medium">Made by {store.name}</dt>
                <dd className="storefront-muted text-sm">
                  Small-batch merch, packed and sent by the creator.
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" style={{ borderTop: '1px solid var(--store-border)' }}>
          <h2 className="mb-6 mt-10 text-xl font-semibold tracking-tight">You might also like</h2>
          <div className="storefront-product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} handle={store.handle} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
