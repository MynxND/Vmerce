import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storefrontServer } from '@/features/storefront/api';
import { ProductCard } from '@/features/storefront/product-card';
import { normalizeHandleParam } from '@/lib/utils';

export const metadata: Metadata = { title: 'All products' };

export default async function StorefrontProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeHandle: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { storeHandle } = await params;
  const { page } = await searchParams;
  const handle = normalizeHandleParam(storeHandle);
  const currentPage = Math.max(1, Number(page ?? '1') || 1);

  const [store, result] = await Promise.all([
    storefrontServer.storeOptional(handle),
    storefrontServer.products(handle, currentPage),
  ]);
  if (!store) notFound();

  const totalPages = Math.max(1, Math.ceil(result.total / result.perPage));

  return (
    <div className="storefront-container py-12">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">All products</h1>
      <p className="storefront-muted mt-2 text-sm">{result.total} items</p>

      {result.items.length === 0 ? (
        <p className="storefront-muted py-20 text-center">Nothing here yet — check back soon.</p>
      ) : (
        <div className="storefront-product-grid mt-8">
          {result.items.map((product) => (
            <ProductCard key={product.id} product={product} handle={handle} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <a
              key={pageNumber}
              href={`?page=${pageNumber}`}
              data-selected={pageNumber === currentPage}
              className="storefront-chip px-3.5 py-2 text-sm"
            >
              {pageNumber}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
