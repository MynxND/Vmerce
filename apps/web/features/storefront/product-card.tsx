import Link from 'next/link';
import { formatMoney } from '@cc/shared';
import type { ProductListItemDto } from '@cc/types';
import { storeUrl } from '@/lib/utils';

export function ProductCard({ product, handle }: { product: ProductListItemDto; handle: string }) {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <Link
      href={storeUrl(handle, `/products/${product.slug}`)}
      className="storefront-surface group block overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--store-shadow)' }}
    >
      <div
        className="relative aspect-square overflow-hidden"
        style={{ backgroundColor: 'var(--store-border)' }}
      >
        {product.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        )}
        {onSale && (
          <span
            className="absolute left-3 top-3 px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: 'var(--store-accent)',
              color: 'var(--store-background)',
              borderRadius: 'var(--store-button-radius)',
            }}
          >
            Sale
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate text-sm font-medium">{product.title}</h3>
        <p className="mt-1 flex items-baseline gap-2 text-sm">
          <span className="font-semibold">
            {formatMoney(product.price, { currency: product.currency })}
          </span>
          {onSale && (
            <span className="storefront-muted text-xs line-through">
              {formatMoney(product.compareAtPrice!, { currency: product.currency })}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
