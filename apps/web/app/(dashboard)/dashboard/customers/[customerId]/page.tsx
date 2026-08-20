import type { Metadata } from 'next';
import { CustomerDetail } from '@/features/customers/customer-detail';

export const metadata: Metadata = { title: 'Customer' };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  return <CustomerDetail customerId={customerId} />;
}
