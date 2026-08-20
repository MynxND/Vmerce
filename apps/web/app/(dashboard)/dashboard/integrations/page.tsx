import type { Metadata } from 'next';
import { Plug } from 'lucide-react';
import { ComingSoon } from '@/components/coming-soon';

export const metadata: Metadata = { title: 'Integrations' };

export default function IntegrationsPage() {
  return (
    <ComingSoon
      icon={Plug}
      phase="Phase 3"
      title="Integrations"
      description="Print-on-demand, dropshipping and payment providers all sit behind adapter interfaces, so connecting one does not change your catalogue."
      bullets={[
        'Fulfillment adapters: Printful, Printify, CJdropshipping, custom APIs',
        'Variant to supplier-SKU mapping is already modelled in the database',
        'Payment providers: Stripe, Omise/Opn, 2C2P, PromptPay, ShopeePay, TrueMoney',
        'Tracking synchronisation back onto orders',
      ]}
    />
  );
}
