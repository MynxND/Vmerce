'use client';

import Link from 'next/link';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import * as React from 'react';
import type { CollectionDto, StorefrontStoreDto } from '@cc/types';
import { useCart } from './cart-store';
import { cn, storeUrl } from '@/lib/utils';

interface StoreHeaderProps {
  store: StorefrontStoreDto;
  collections: CollectionDto[];
}

export function StoreHeader({ store, collections }: StoreHeaderProps) {
  const { data: cart } = useCart(store.handle);
  const [open, setOpen] = React.useState(false);
  const itemCount = cart?.itemCount ?? 0;

  const links = collections.slice(0, 5);

  return (
    <header className="sticky top-0 z-40">
      <div className="storefront-nav-shell">
      <div className="storefront-container flex h-[72px] items-center gap-4">
        <Link href={storeUrl(store.handle)} className="flex min-w-0 items-center gap-2.5">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logoUrl}
              alt=""
              className="size-8 shrink-0 rounded-full object-cover"
              style={{ border: '1px solid var(--store-border)' }}
            />
          ) : null}
          <span className="truncate text-xl font-black uppercase tracking-[-0.04em]">{store.name}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          <Link href={storeUrl(store.handle, '/products')} className="text-xs font-black uppercase tracking-wide hover:opacity-70">
            Shop all
          </Link>
          {links.map((collection) => (
            <Link
              key={collection.id}
              href={storeUrl(store.handle, `/collections/${collection.slug}`)}
              className="text-xs font-black uppercase tracking-wide hover:opacity-70"
            >
              {collection.name}
            </Link>
          ))}
        </nav>

        <Link href={storeUrl(store.handle, '/products')} className="ml-auto p-2 md:ml-0" aria-label="Search products"><Search className="size-5" /></Link>
        <Link
          href={storeUrl(store.handle, '/cart')}
          className="relative ml-auto flex items-center gap-2 px-2 py-1.5 text-sm md:ml-0"
          aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
        >
          <ShoppingBag className="size-5" />
          {itemCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-[0.625rem] font-bold"
              style={{ backgroundColor: 'var(--store-primary)', color: 'var(--store-background)' }}
            >
              {itemCount}
            </span>
          )}
        </Link>

        <button
          type="button"
          className="md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav
          className={cn('storefront-container flex flex-col gap-1 pb-4 md:hidden')}
          style={{ borderTop: '1px solid var(--store-border)' }}
        >
          <Link
            href={storeUrl(store.handle, '/products')}
            className="py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            All products
          </Link>
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={storeUrl(store.handle, `/collections/${collection.slug}`)}
              className="py-2 text-sm"
              onClick={() => setOpen(false)}
            >
              {collection.name}
            </Link>
          ))}
        </nav>
      )}
      </div>
    </header>
  );
}
