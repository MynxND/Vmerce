import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoreHeader } from '@/features/storefront/store-header';
import { StoreFooter } from '@/features/storefront/store-footer';
import { storefrontServer } from '@/features/storefront/api';
import { ThemeFonts, themeStyle } from '@/features/storefront/theme-style';
import { normalizeHandleParam } from '@/lib/utils';

interface LayoutParams {
  params: Promise<{ storeHandle: string }>;
}

export async function generateMetadata({ params }: LayoutParams): Promise<Metadata> {
  const { storeHandle } = await params;
  const store = await storefrontServer.storeOptional(normalizeHandleParam(storeHandle));
  if (!store) return { title: 'Shop not found' };

  return {
    title: { default: store.name, template: `%s · ${store.name}` },
    description: store.description ?? `Official merch from ${store.name}.`,
    openGraph: {
      title: store.name,
      description: store.description ?? undefined,
      images: store.bannerUrl ? [store.bannerUrl] : undefined,
      type: 'website',
    },
  };
}

/**
 * Storefront shell.
 *
 * The creator's theme is applied as inline CSS variables on this wrapper, which
 * is the only bridge between saved theme data and rendered styles. Nothing in
 * here shares styling with the dashboard.
 */
export default async function StorefrontLayout({
  children,
  params,
}: LayoutParams & { children: React.ReactNode }) {
  const { storeHandle } = await params;
  const handle = normalizeHandleParam(storeHandle);

  const store = await storefrontServer.storeOptional(handle);
  if (!store) notFound();

  const collections = await storefrontServer.collections(handle).catch(() => []);

  return (
    <>
      <ThemeFonts theme={store.theme} />
      <div className="storefront flex min-h-dvh flex-col" style={themeStyle(store.theme)}>
        <StoreHeader store={store} collections={collections} />
        <div className="flex-1">{children}</div>
        <StoreFooter store={store} collections={collections} />
      </div>
    </>
  );
}
