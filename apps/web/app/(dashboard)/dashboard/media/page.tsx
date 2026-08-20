import type { Metadata } from 'next';
import { MediaLibrary } from '@/features/stores/media-library';

export const metadata: Metadata = { title: 'Media' };

export default function MediaPage() {
  return <MediaLibrary />;
}
