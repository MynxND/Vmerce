import type { Metadata } from 'next';
import { StoreEditor } from '@/features/editor/store-editor';

export const metadata: Metadata = { title: 'Store editor' };

export default function StoreEditorPage() {
  return <StoreEditor />;
}
