import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storefrontServer } from '@/features/storefront/api';
import { CheckoutForm } from '@/features/storefront/checkout-form';
import { normalizeHandleParam } from '@/lib/utils';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ storeHandle: string }>;
}) {
  const { storeHandle } = await params;
  const handle = normalizeHandleParam(storeHandle);

  const [store, options] = await Promise.all([
    storefrontServer.storeOptional(handle),
    storefrontServer.checkoutOptions(handle),
  ]);
  if (!store) notFound();

  return <CheckoutForm store={store} options={options} />;
}
