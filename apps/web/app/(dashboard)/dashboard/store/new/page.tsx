import type { Metadata } from 'next';
import { CreateStoreForm } from '@/features/stores/create-store-form';

export const metadata: Metadata = { title: 'New shop' };

export default function NewStorePage() {
  return <CreateStoreForm />;
}
