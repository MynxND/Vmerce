import { DEFAULT_SHIPPING_OPTIONS } from '@cc/shared';
import type {
  CreateFulfillmentOrderInput,
  FulfillmentOrderResult,
  FulfillmentProviderAdapter,
  ShippingRate,
} from './types';

/** In-house fulfillment: state lives in our own `FulfillmentOrder` rows. */
export const manualFulfillmentAdapter: FulfillmentProviderAdapter = {
  kind: 'MANUAL',

  async createOrder(input: CreateFulfillmentOrderInput): Promise<FulfillmentOrderResult> {
    return {
      externalId: null,
      status: 'UNFULFILLED',
      trackingNumber: null,
      trackingUrl: null,
      raw: { orderNumber: input.orderNumber, itemCount: input.items.length },
    };
  },

  async getOrder(): Promise<FulfillmentOrderResult> {
    return {
      externalId: null,
      status: 'UNFULFILLED',
      trackingNumber: null,
      trackingUrl: null,
      raw: {},
    };
  },

  async cancelOrder() {
    return { cancelled: true };
  },

  async getShippingRates(): Promise<ShippingRate[]> {
    return DEFAULT_SHIPPING_OPTIONS.map((option) => ({
      id: option.id,
      label: option.label,
      amount: option.amount,
      currency: 'THB',
      estimatedDays: option.estimatedDays,
    }));
  },

  async getTracking() {
    return { trackingNumber: null, trackingUrl: null };
  },

  async syncProducts() {
    return [];
  },
};
