/**
 * Generic fulfillment adapter contract.
 *
 * Deliberately provider-agnostic: CJdropshipping, Printful, Printify, a local
 * manufacturer or an in-house warehouse all implement this same surface. No
 * concrete integration ships in Phase 1 — only the `manual` adapter, which is a
 * no-op that keeps fulfillment state inside our own database.
 */
export interface FulfillmentLineItem {
  variantId: string;
  supplierSku: string | null;
  quantity: number;
  title: string;
}

export interface FulfillmentAddress {
  firstName: string;
  lastName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  district: string | null;
  province: string;
  postalCode: string;
  country: string;
}

export interface CreateFulfillmentOrderInput {
  orderId: string;
  orderNumber: string;
  items: FulfillmentLineItem[];
  address: FulfillmentAddress;
  shippingMethod: string | null;
  note: string | null;
}

export interface FulfillmentOrderResult {
  externalId: string | null;
  status: 'UNFULFILLED' | 'PROCESSING' | 'FULFILLED' | 'SHIPPED' | 'DELIVERED';
  trackingNumber: string | null;
  trackingUrl: string | null;
  raw: Record<string, unknown>;
}

export interface ShippingRate {
  id: string;
  label: string;
  amount: number;
  currency: string;
  estimatedDays: string | null;
}

export interface SupplierProduct {
  supplierProductId: string;
  supplierSku: string;
  title: string;
  price: number | null;
  currency: string | null;
}

export interface FulfillmentProviderAdapter {
  readonly kind: 'MANUAL' | 'PRINTFUL' | 'PRINTIFY' | 'CJ_DROPSHIPPING' | 'CUSTOM';
  createOrder(input: CreateFulfillmentOrderInput): Promise<FulfillmentOrderResult>;
  getOrder(externalId: string): Promise<FulfillmentOrderResult>;
  cancelOrder(externalId: string): Promise<{ cancelled: boolean }>;
  getShippingRates(input: {
    address: FulfillmentAddress;
    items: FulfillmentLineItem[];
  }): Promise<ShippingRate[]>;
  getTracking(
    externalId: string,
  ): Promise<{ trackingNumber: string | null; trackingUrl: string | null }>;
  syncProducts(): Promise<SupplierProduct[]>;
}
