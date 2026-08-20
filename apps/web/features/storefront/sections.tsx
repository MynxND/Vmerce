import Link from 'next/link';
import type {
  CollectionDto,
  ProductListItemDto,
  StoreSectionDto,
  StorefrontStoreDto,
} from '@cc/types';
import { ProductCard } from './product-card';
import { storeUrl } from '@/lib/utils';

interface SectionContext {
  store: StorefrontStoreDto;
  collections: CollectionDto[];
  products: ProductListItemDto[];
}

function settingString(section: StoreSectionDto, key: string, fallback = ''): string {
  const value = section.settings[key];
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}

function settingNumber(section: StoreSectionDto, key: string, fallback: number): number {
  const value = section.settings[key];
  return typeof value === 'number' ? value : fallback;
}

function Hero({ section, store }: { section: StoreSectionDto; store: StorefrontStoreDto }) {
  const title = settingString(section, 'title', `Welcome to ${store.name}`);
  const subtitle = settingString(section, 'subtitle');
  const buttonText = settingString(section, 'buttonText', 'Shop now');
  const imageUrl = settingString(section, 'imageUrl');
  const alignment = settingString(section, 'alignment', 'center');

  return (
    <section className="relative overflow-hidden">
      {imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundColor: 'color-mix(in oklab, var(--store-background) 62%, transparent)',
            }}
          />
        </>
      )}
      <div
        className="storefront-container relative py-20 sm:py-28"
        style={{ textAlign: alignment as 'left' | 'center' | 'right' }}
      >
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{title}</h1>
        {subtitle && (
          <p className="storefront-muted mx-auto mt-4 max-w-xl text-base sm:text-lg">{subtitle}</p>
        )}
        <Link
          href={storeUrl(store.handle, '/products')}
          className="storefront-button mt-8 inline-block px-6 py-3 text-sm font-semibold"
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}

function ProductSection({
  section,
  context,
  collectionSlug,
}: {
  section: StoreSectionDto;
  context: SectionContext;
  collectionSlug?: string;
}) {
  const title = settingString(section, 'title', 'Products');
  const limit = settingNumber(section, 'limit', 8);

  // Filtering happens here rather than in a second request: the home payload
  // already carries the store's newest products.
  const products = context.products.slice(0, limit);
  if (products.length === 0) return null;

  return (
    <section className="storefront-container py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <Link
          href={
            collectionSlug
              ? storeUrl(context.store.handle, `/collections/${collectionSlug}`)
              : storeUrl(context.store.handle, '/products')
          }
          className="storefront-muted shrink-0 text-sm hover:opacity-70"
        >
          View all →
        </Link>
      </div>
      <div className="storefront-product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} handle={context.store.handle} />
        ))}
      </div>
    </section>
  );
}

function CollectionList({
  section,
  context,
}: {
  section: StoreSectionDto;
  context: SectionContext;
}) {
  if (context.collections.length === 0) return null;
  const title = settingString(section, 'title', 'Shop by collection');

  return (
    <section className="storefront-container py-14">
      <h2 className="mb-6 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {context.collections.map((collection) => (
          <Link
            key={collection.id}
            href={storeUrl(context.store.handle, `/collections/${collection.slug}`)}
            className="storefront-surface group relative block overflow-hidden"
          >
            <div className="aspect-[16/9]" style={{ backgroundColor: 'var(--store-border)' }}>
              {collection.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={collection.imageUrl}
                  alt=""
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              )}
            </div>
            <div className="p-4">
              <p className="font-medium">{collection.name}</p>
              <p className="storefront-muted text-sm">{collection.productCount} products</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TextBlock({ section }: { section: StoreSectionDto }) {
  const title = settingString(section, 'title');
  const body = settingString(section, 'body');
  if (!title && !body) return null;

  return (
    <section className="storefront-container py-14">
      <div className="mx-auto max-w-2xl text-center">
        {title && <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>}
        {body && <p className="storefront-muted mt-3 text-base leading-relaxed">{body}</p>}
      </div>
    </section>
  );
}

function ImageBanner({ section }: { section: StoreSectionDto }) {
  const imageUrl = settingString(section, 'imageUrl');
  const title = settingString(section, 'title');
  if (!imageUrl && !title) return null;

  return (
    <section className="storefront-container py-8">
      <div className="storefront-surface relative overflow-hidden">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="aspect-[21/9] w-full object-cover" loading="lazy" />
        )}
        {title && (
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="px-6 text-center text-2xl font-bold tracking-tight">{title}</h2>
          </div>
        )}
      </div>
    </section>
  );
}

function SocialLinks({ section, context }: { section: StoreSectionDto; context: SectionContext }) {
  const entries = Object.entries(context.store.socialLinks).filter(([, url]) => Boolean(url));
  if (entries.length === 0) return null;

  const title = settingString(section, 'title', 'Follow me');

  return (
    <section className="storefront-container py-14 text-center">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {entries.map(([key, url]) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="storefront-button-outline px-4 py-2 text-sm font-medium capitalize hover:opacity-70"
          >
            {key}
          </a>
        ))}
      </div>
    </section>
  );
}

function Newsletter({ section }: { section: StoreSectionDto }) {
  const title = settingString(section, 'title', 'Never miss a drop');
  const subtitle = settingString(section, 'subtitle');
  const buttonText = settingString(section, 'buttonText', 'Subscribe');

  return (
    <section className="storefront-container py-14">
      <div className="storefront-surface p-8 text-center">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="storefront-muted mt-2 text-sm">{subtitle}</p>}
        {/* Capture is wired up with the rest of the marketing tooling in Phase 2. */}
        <form className="mx-auto mt-5 flex max-w-sm gap-2" action="#">
          <input
            type="email"
            required
            placeholder="you@email.com"
            aria-label="Email address"
            className="storefront-chip flex-1 px-3 py-2 text-sm outline-none"
          />
          <button type="submit" className="storefront-button px-4 py-2 text-sm font-semibold">
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}

/** Renders one saved section. Unknown or chrome sections render nothing. */
export function StoreSection({
  section,
  context,
}: {
  section: StoreSectionDto;
  context: SectionContext;
}) {
  if (!section.visible) return null;

  switch (section.type) {
    case 'HERO':
      return <Hero section={section} store={context.store} />;
    case 'FEATURED_PRODUCTS':
      return (
        <ProductSection
          section={section}
          context={context}
          collectionSlug={
            typeof section.settings.collectionSlug === 'string'
              ? section.settings.collectionSlug
              : undefined
          }
        />
      );
    case 'PRODUCT_GRID':
      return <ProductSection section={section} context={context} />;
    case 'COLLECTION_LIST':
      return <CollectionList section={section} context={context} />;
    case 'TEXT_BLOCK':
      return <TextBlock section={section} />;
    case 'IMAGE_BANNER':
    case 'IMAGE_WITH_TEXT':
      return <ImageBanner section={section} />;
    case 'SOCIAL_LINKS':
      return <SocialLinks section={section} context={context} />;
    case 'NEWSLETTER':
      return <Newsletter section={section} />;
    // HEADER and FOOTER are rendered by the layout, not as page sections.
    default:
      return null;
  }
}
