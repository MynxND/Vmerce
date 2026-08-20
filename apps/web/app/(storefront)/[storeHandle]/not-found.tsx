import Link from 'next/link';

export default function StorefrontNotFound() {
  return (
    <div className="storefront-container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p
        className="text-sm font-semibold uppercase tracking-[0.16em]"
        style={{ color: 'var(--store-primary)' }}
      >
        404
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">We could not find that page</h1>
      <p className="storefront-muted mt-2 max-w-sm text-sm">
        The shop, product or collection you were looking for may have been renamed or unpublished.
      </p>
      <Link href="/" className="storefront-button mt-7 px-5 py-2.5 text-sm font-semibold">
        Back to the platform
      </Link>
    </div>
  );
}
