import Link from 'next/link';
import type { CollectionDto, StorefrontStoreDto } from '@cc/types';
import { storeUrl } from '@/lib/utils';
import { clientEnv } from '@/lib/env';

const SOCIAL_LABELS: Record<string, string> = {
  twitch: 'Twitch',
  youtube: 'YouTube',
  x: 'X',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  discord: 'Discord',
};

export function StoreFooter({
  store,
  collections,
}: {
  store: StorefrontStoreDto;
  collections: CollectionDto[];
}) {
  const socials = Object.entries(store.socialLinks).filter(([, url]) => Boolean(url));

  return (
    <footer style={{ borderTop: '1px solid var(--store-border)' }}>
      <div className="storefront-container grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <p className="text-sm font-semibold">{store.name}</p>
          {store.description && (
            <p className="storefront-muted mt-2 max-w-xs text-sm leading-relaxed">
              {store.description}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href={storeUrl(store.handle, '/products')} className="hover:opacity-70">
                All products
              </Link>
            </li>
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link
                  href={storeUrl(store.handle, `/collections/${collection.slug}`)}
                  className="hover:opacity-70"
                >
                  {collection.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {socials.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider">Elsewhere</p>
            <ul className="mt-3 space-y-2 text-sm">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:opacity-70"
                  >
                    {SOCIAL_LABELS[key] ?? key}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div
        className="storefront-container flex flex-wrap items-center justify-between gap-2 py-5 text-xs"
        style={{ borderTop: '1px solid var(--store-border)' }}
      >
        <span className="storefront-muted">
          © {new Date().getFullYear()} {store.name}
        </span>
        <span className="storefront-muted">
          Powered by{' '}
          <Link href="/" className="underline hover:no-underline">
            {clientEnv.platformName}
          </Link>
        </span>
      </div>
    </footer>
  );
}
