import { ApiError } from '../../utils/errors';
import { manualPaymentProvider } from './manual.provider';
import type { PaymentProvider } from './types';

const providers = new Map<string, PaymentProvider>([
  [manualPaymentProvider.key, manualPaymentProvider],
]);

export function registerPaymentProvider(provider: PaymentProvider): void {
  providers.set(provider.key, provider);
}

export function getPaymentProvider(key: string): PaymentProvider {
  const provider = providers.get(key);
  if (!provider) {
    throw ApiError.badRequest(`Payment provider "${key}" is not available`, 'UNSUPPORTED_PROVIDER');
  }
  return provider;
}

export function listPaymentProviders(): Array<
  Pick<PaymentProvider, 'key' | 'label' | 'instructions'>
> {
  return [...providers.values()].map(({ key, label, instructions }) => ({
    key,
    label,
    instructions,
  }));
}
