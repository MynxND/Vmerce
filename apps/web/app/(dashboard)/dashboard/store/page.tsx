import type { Metadata } from 'next';
import { StoreSettings } from '@/features/stores/store-settings';

export const metadata: Metadata = { title: 'Store' };

export default function StorePage() {
  return <StoreSettings />;
}
