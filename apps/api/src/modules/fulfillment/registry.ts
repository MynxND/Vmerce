import type { FulfillmentProviderKind } from '@cc/types';
import { ApiError } from '../../utils/errors';
import { manualFulfillmentAdapter } from './manual.adapter';
import type { FulfillmentProviderAdapter } from './types';

const adapters = new Map<string, FulfillmentProviderAdapter>([
  [manualFulfillmentAdapter.kind, manualFulfillmentAdapter],
]);

/** Phase 3 registers CJ / Printful / Printify adapters here. */
export function registerFulfillmentAdapter(adapter: FulfillmentProviderAdapter): void {
  adapters.set(adapter.kind, adapter);
}

export function getFulfillmentAdapter(kind: FulfillmentProviderKind): FulfillmentProviderAdapter {
  const adapter = adapters.get(kind);
  if (!adapter) {
    throw ApiError.badRequest(
      `Fulfillment provider "${kind}" is not connected`,
      'UNSUPPORTED_PROVIDER',
    );
  }
  return adapter;
}

export function listFulfillmentAdapters(): string[] {
  return [...adapters.keys()];
}
