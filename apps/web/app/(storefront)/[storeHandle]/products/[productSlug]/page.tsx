import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storefrontServer } from '@/features/storefront/api';
import { ProductDetail } from '@/features/storefront/product-detail';
import { normalizeHandleParam } from '@/lib/utils';

interface PageParams {
  params: Promise<{ storeHandle: string; productSlug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { storeHandle, productSlug } = await params;
  const data = await storefrontServer.product(normalizeHandleParam(storeHandle), productSlug);
  if (!data) return { title: 'Product not found' };

  const { product } = data;
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.description?.slice(0, 155) ?? undefined,
    openGraph: {
      title: product.title,
      images: product.media[0]?.url ? [product.media[0].url] : undefined,
    },
  };
}

export default async function StorefrontProductPage({ params }: PageParams) {
  const { storeHandle, productSlug } = await params;
  const handle = normalizeHandleParam(storeHandle);

  const [store, data] = await Promise.all([
    storefrontServer.storeOptional(handle),
    storefrontServer.product(handle, productSlug),
  ]);

  if (!store || !data) notFound();

  return <ProductDetail store={store} product={data.product} related={data.related} />;
}
