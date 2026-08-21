import Link from 'next/link';
import { formatMoney } from '@cc/shared';
import type { ProductListItemDto } from '@cc/types';
import { storeUrl } from '@/lib/utils';

export function ProductCard({ product, handle }: { product: ProductListItemDto; handle: string }) {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <Link
      href={storeUrl(handle, `/products/${product.slug}`)}
      className="storefront-product-card group block overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
      style={{ borderColor: 'var(--store-border)' }}
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
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
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

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-bold leading-tight">{product.title}</h3>
          <span className="storefront-chip shrink-0 px-2 py-1 text-[10px] font-black uppercase tracking-wide">View</span>
        </div>
        <p className="flex items-baseline gap-2 text-sm">
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
