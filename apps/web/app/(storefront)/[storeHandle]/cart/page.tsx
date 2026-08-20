import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storefrontServer } from '@/features/storefront/api';
import { CartView } from '@/features/storefront/cart-view';
import { normalizeHandleParam } from '@/lib/utils';

export const metadata: Metadata = { title: 'Cart' };

export default async function CartPage({ params }: { params: Promise<{ storeHandle: string }> }) {
  const { storeHandle } = await params;
  const store = await storefrontServer.storeOptional(normalizeHandleParam(storeHandle));
  if (!store) notFound();

  return <CartView store={store} />;
}
