import { notFound } from 'next/navigation';
import { storefrontServer } from '@/features/storefront/api';
import { StoreSection } from '@/features/storefront/sections';
import { ApiClientError } from '@/lib/api-error';
import { normalizeHandleParam } from '@/lib/utils';

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ storeHandle: string }>;
}) {
  const { storeHandle } = await params;
  const handle = normalizeHandleParam(storeHandle);

  const home = await storefrontServer.home(handle).catch((error: unknown) => {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  });
  if (!home) notFound();

  const context = { store: home.store, collections: home.collections, products: home.products };

  return (
    <>
      {home.page.sections.map((section) => (
        <StoreSection key={section.id} section={section} context={context} />
      ))}
    </>
  );
}
