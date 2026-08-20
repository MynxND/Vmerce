import type { Metadata } from 'next';
import { DiscountManager } from '@/features/discounts/discount-manager';

export const metadata: Metadata = { title: 'Discounts' };

export default function DiscountsPage() {
  return <DiscountManager />;
}
