import type {
  CartDto,
  CollectionDto,
  OrderDto,
  PaymentInstructionDto,
  PaymentProofDto,
  ProductDto,
  ProductListItemDto,
  StorePageDto,
  StorefrontPaymentChannelDto,
  StorefrontStoreDto,
} from '@cc/types';
import type { AddCartItemInput, CheckoutInput, ShippingOption } from '@cc/shared';
import { api } from '@/services/http';
import { serverFetch, serverFetchOptional } from '@/services/server-api';

export interface StorefrontHome {
  store: StorefrontStoreDto;
  page: StorePageDto;
  collections: CollectionDto[];
  products: ProductListItemDto[];
}

export interface StorefrontProductPage {
  product: ProductDto;
  related: ProductListItemDto[];
}

export interface StorefrontCollectionPage {
  collection: CollectionDto;
  products: ProductListItemDto[];
}

export interface CheckoutOptions {
  currency: string;
  shippingOptions: ShippingOption[];
  paymentChannels: StorefrontPaymentChannelDto[];
}

/** What the confirmation page needs: the order, how to pay, and slip history. */
export interface PublicOrderView {
  order: OrderDto;
  instruction: PaymentInstructionDto | null;
  proofs: PaymentProofDto[];
}

/** Server Component loaders — no auth, no client bundle. */
export const storefrontServer = {
  store: (handle: string) => serverFetch<StorefrontStoreDto>(`/storefront/${handle}`),
  storeOptional: (handle: string) =>
    serverFetchOptional<StorefrontStoreDto>(`/storefront/${handle}`),
  home: (handle: string) => serverFetch<StorefrontHome>(`/storefront/${handle}/home`),
  product: (handle: string, slug: string) =>
    serverFetchOptional<StorefrontProductPage>(`/storefront/${handle}/products/${slug}`),
  collections: (handle: string) =>
    serverFetch<CollectionDto[]>(`/storefront/${handle}/collections`),
  collection: (handle: string, slug: string) =>
    serverFetchOptional<StorefrontCollectionPage>(`/storefront/${handle}/collections/${slug}`),
  products: (handle: string, page = 1) =>
    serverFetch<{ items: ProductListItemDto[]; total: number; page: number; perPage: number }>(
      `/storefront/${handle}/products?page=${page}&limit=24`,
    ),
  checkoutOptions: (handle: string) =>
    serverFetch<CheckoutOptions>(`/storefront/${handle}/checkout-options`),
  order: (handle: string, orderNumber: string, email: string) =>
    serverFetchOptional<PublicOrderView>(
      `/storefront/${handle}/order-lookup?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`,
    ),
};

/** Browser calls. The cart cookie travels with `credentials: include`. */
export const storefrontApi = {
  getCart: (handle: string) => api.get<CartDto>(`/storefront/${handle}/cart`, { anonymous: true }),

  addItem: (handle: string, input: AddCartItemInput) =>
    api.post<CartDto>(`/storefront/${handle}/cart/items`, input, { anonymous: true }),

  updateItem: (handle: string, itemId: string, quantity: number) =>
    api.patch<CartDto>(
      `/storefront/${handle}/cart/items/${itemId}`,
      { quantity },
      { anonymous: true },
    ),

  removeItem: (handle: string, itemId: string) =>
    api.delete<CartDto>(`/storefront/${handle}/cart/items/${itemId}`, { anonymous: true }),

  applyDiscount: (handle: string, code: string | null) =>
    api.post<CartDto>(`/storefront/${handle}/cart/discount`, { code }, { anonymous: true }),

  checkout: (handle: string, input: CheckoutInput) =>
    api.post<OrderDto>(`/storefront/${handle}/checkout`, input, { anonymous: true }),

  /** Buyer uploads their transfer slip; multipart, so no JSON content type. */
  submitPaymentProof: (
    handle: string,
    orderNumber: string,
    input: { email: string; amount: number; reference?: string; slip: File },
  ) => {
    const body = new FormData();
    body.append('slip', input.slip);
    body.append('email', input.email);
    body.append('amount', String(input.amount));
    if (input.reference) body.append('reference', input.reference);

    return api.post<PaymentProofDto>(
      `/storefront/${handle}/orders/${encodeURIComponent(orderNumber)}/payment-proof`,
      body,
      { anonymous: true },
    );
  },
};

export const cartKeys = {
  cart: (handle: string) => ['storefront', handle, 'cart'] as const,
};
