import type { Metadata } from 'next';
import { StoreSettings } from '@/features/stores/store-settings';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return <StoreSettings />;
}
