import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type {
  CollectionDto,
  ProductListItemDto,
  StoreSectionDto,
  StorefrontStoreDto,
} from '@cc/types';
import { ProductCard } from './product-card';
import { storeUrl } from '@/lib/utils';
import { getStorefrontFont } from '@cc/shared';

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
  const imageUrl = settingString(section, 'imageUrl', store.bannerUrl ?? '');
  const alignment = settingString(section, 'alignment', 'center');
  const contentX = Math.min(96, Math.max(4, settingNumber(section, 'contentX', alignment === 'left' ? 4 : alignment === 'right' ? 96 : 50)));
  const contentY = Math.min(90, Math.max(15, settingNumber(section, 'contentY', 70)));
  const headingFont = getStorefrontFont(section.settings.headingFont);
  const headingSize = Math.min(160, Math.max(32, settingNumber(section, 'headingSize', 96)));
  const headingWeight = Math.min(900, Math.max(100, settingNumber(section, 'headingWeight', 900)));
  const headingLetterSpacing = Math.min(30, Math.max(-12, settingNumber(section, 'headingLetterSpacing', -4)));
  const headingTransform = settingString(section, 'headingTransform', 'uppercase');
  const textColor = settingString(section, 'textColor', '#ffffff');
  const buttonBackground = settingString(section, 'buttonBackground', 'var(--store-primary)');
  const buttonTextColor = settingString(section, 'buttonTextColor', '#050509');
  const buttonOffsetX = Math.min(500, Math.max(-500, settingNumber(section, 'buttonOffsetX', 0)));
  const buttonOffsetY = Math.min(500, Math.max(-500, settingNumber(section, 'buttonOffsetY', 0)));
  const headingFontFamily = `'${headingFont.family}', ${headingFont.fallback}`;

  return (
    <section className="storefront-hero relative overflow-hidden">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
      )}
      <div className="relative min-h-[62vh] sm:min-h-[72vh]">
      <div
        data-hero-content
        className="absolute flex w-[92%] max-w-4xl touch-none flex-col"
        style={{
          textAlign: alignment as 'left' | 'center' | 'right',
          alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
          left: `${contentX}%`,
          top: `${contentY}%`,
          transform: `translate(${alignment === 'center' ? '-50%' : alignment === 'right' ? '-100%' : '0'}, -50%)`,
          color: textColor,
        }}
      >
        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em]">New collection</p>
        <h1 className="max-w-4xl leading-[0.92]" style={{ fontFamily: headingFontFamily, fontSize: `clamp(2rem, ${headingSize / 12}vw, ${headingSize}px)`, fontWeight: headingWeight, letterSpacing: `${headingLetterSpacing}px`, textTransform: headingTransform as 'none' | 'uppercase' | 'lowercase' | 'capitalize' }}>{title}</h1>
        {subtitle && (
          <p className="mt-5 max-w-xl text-base font-medium sm:text-lg">{subtitle}</p>
        )}
        <Link
          data-hero-button
          href={storeUrl(store.handle, '/products')}
          className="storefront-button mt-8 inline-block w-fit px-7 py-3.5 text-sm font-black uppercase tracking-wide"
          style={{ backgroundColor: buttonBackground, color: buttonTextColor, transform: `translate(${buttonOffsetX}px, ${buttonOffsetY}px)` }}
        >
          {buttonText}
        </Link>
      </div>
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
    <section className="storefront-drop py-16 sm:py-20">
      <div className="storefront-container">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><p className="mb-2 text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60">Fresh from the studio</p><h2 className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-5xl">{title}</h2></div>
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
      <p className="mb-2 text-[0.6875rem] font-black uppercase tracking-[0.2em] opacity-60">Browse our</p>
      <h2 className="mb-8 text-3xl font-black uppercase tracking-[-0.04em] sm:text-5xl">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {context.collections.map((collection) => (
          <Link
            key={collection.id}
            href={storeUrl(context.store.handle, `/collections/${collection.slug}`)}
            className="storefront-collection-card group relative block overflow-hidden"
          >
            <div className="aspect-[4/3]" style={{ backgroundColor: 'var(--store-border)' }}>
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
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-xl font-black uppercase tracking-tight">{collection.name}</p>
              <p className="text-sm text-white/70">{collection.productCount} products →</p>
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

function Marquee({ section }: { section: StoreSectionDto }) {
  const items = settingString(section, 'items', 'NEW DROP|LIVE NOW|JOIN THE COMMUNITY')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length === 0) return null;

  const separator = settingString(section, 'separator', '///');
  const speed = Math.min(90, Math.max(6, settingNumber(section, 'speed', 24)));
  const direction = settingString(section, 'direction', 'left');
  const backgroundColor = settingString(section, 'backgroundColor', '#070810');
  const textColor = settingString(section, 'textColor', '#b9c2d6');
  const accentColor = settingString(section, 'accentColor', '#d958ff');

  return (
    <section
      className="storefront-marquee overflow-hidden border-y border-white/10 py-3"
      style={{ backgroundColor, color: textColor }}
      aria-label="Scrolling announcements"
    >
      <div
        className="storefront-marquee-track flex w-max items-center whitespace-nowrap"
        style={{
          animationDuration: `${speed}s`,
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center">
            <span className="px-7 text-[0.6875rem] font-black uppercase tracking-[0.28em] sm:px-10 sm:text-xs">
              {item}
            </span>
            <span aria-hidden className="font-black tracking-[0.22em]" style={{ color: accentColor }}>
              {separator}
            </span>
          </span>
        ))}
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

  const font = getStorefrontFont(section.settings.sectionFont ?? 'Manrope');
  const alignment = settingString(section, 'sectionAlignment');
  const headingSize = section.settings.sectionHeadingSize;
  const style = {
    ...(settingString(section, 'sectionFont') ? { fontFamily: `'${font.family}', ${font.fallback}` } : {}),
    ...(alignment ? { textAlign: alignment } : {}),
    ...(settingString(section, 'sectionTextColor') ? { color: settingString(section, 'sectionTextColor') } : {}),
    ...(settingString(section, 'sectionBackground') ? { backgroundColor: settingString(section, 'sectionBackground') } : {}),
    ...(typeof headingSize === 'number' ? { '--section-heading-size': `${headingSize}px` } : {}),
  } as CSSProperties;
  const styled = (children: ReactNode) => <div className="storefront-section-style" style={style}>{children}</div>;

  switch (section.type) {
    case 'HERO':
      return <Hero section={section} store={context.store} />;
    case 'FEATURED_PRODUCTS':
      return styled(
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
      return styled(<ProductSection section={section} context={context} />);
    case 'COLLECTION_LIST':
      return styled(<CollectionList section={section} context={context} />);
    case 'TEXT_BLOCK':
      return styled(<TextBlock section={section} />);
    case 'IMAGE_BANNER':
    case 'IMAGE_WITH_TEXT':
      return styled(<ImageBanner section={section} />);
    case 'SOCIAL_LINKS':
      return styled(<SocialLinks section={section} context={context} />);
    case 'NEWSLETTER':
      return styled(<Newsletter section={section} />);
    case 'MARQUEE':
      return styled(<Marquee section={section} />);
    // HEADER and FOOTER are rendered by the layout, not as page sections.
    default:
      return null;
  }
}
