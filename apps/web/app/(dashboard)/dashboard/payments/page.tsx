import type { Metadata } from 'next';
import { PaymentChannelManager } from '@/features/payments/channel-manager';

export const metadata: Metadata = { title: 'Payments' };

export default function PaymentsPage() {
  return <PaymentChannelManager />;
}
