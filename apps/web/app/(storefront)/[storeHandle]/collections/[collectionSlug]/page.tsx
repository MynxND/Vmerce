import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storefrontServer } from '@/features/storefront/api';
import { ProductCard } from '@/features/storefront/product-card';
import { normalizeHandleParam } from '@/lib/utils';

interface PageParams {
  params: Promise<{ storeHandle: string; collectionSlug: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { storeHandle, collectionSlug } = await params;
  const data = await storefrontServer.collection(normalizeHandleParam(storeHandle), collectionSlug);
  if (!data) return { title: 'Collection not found' };
  return {
    title: data.collection.name,
    description: data.collection.description ?? undefined,
  };
}

export default async function StorefrontCollectionPage({ params }: PageParams) {
  const { storeHandle, collectionSlug } = await params;
  const handle = normalizeHandleParam(storeHandle);

  const data = await storefrontServer.collection(handle, collectionSlug);
  if (!data) notFound();

  return (
    <div className="storefront-container py-12">
      {data.collection.imageUrl && (
        <div
          className="mb-8 aspect-[21/9] overflow-hidden"
          style={{ borderRadius: 'var(--store-radius)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.collection.imageUrl} alt="" className="size-full object-cover" />
        </div>
      )}

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.collection.name}</h1>
      {data.collection.description && (
        <p className="storefront-muted mt-2 max-w-2xl text-base">{data.collection.description}</p>
      )}

      {data.products.length === 0 ? (
        <p className="storefront-muted py-20 text-center">This collection is empty for now.</p>
      ) : (
        <div className="storefront-product-grid mt-8">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} handle={handle} />
          ))}
        </div>
      )}
    </div>
  );
}
