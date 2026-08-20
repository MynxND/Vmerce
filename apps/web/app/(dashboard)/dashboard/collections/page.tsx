import type { Metadata } from 'next';
import { CollectionManager } from '@/features/collections/collection-manager';

export const metadata: Metadata = { title: 'Collections' };

export default function CollectionsPage() {
  return <CollectionManager />;
}
