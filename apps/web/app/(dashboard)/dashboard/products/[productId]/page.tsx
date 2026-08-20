import type { Metadata } from 'next';
import { ProductForm } from '@/features/products/product-form';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProductForm productId={productId} />;
}
