import type { Metadata } from 'next';
import { StartWizard } from '@/features/stores/start-wizard';

export const metadata: Metadata = { title: 'Start creating' };

export default function StartPage() {
  return <StartWizard />;
}
