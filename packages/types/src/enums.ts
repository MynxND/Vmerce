/**
 * Runtime-safe enum mirrors of the Prisma enums.
 *
 * These are declared as `const` objects (not TS `enum`s) so that the same value
 * can be imported by the Express API, the Next.js server components and the
 * browser bundle without pulling in the Prisma client.
 *
 * Keep in sync with `apps/api/prisma/schema.prisma`.
 */

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STORE_OWNER: 'STORE_OWNER',
  STORE_ADMIN: 'STORE_ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const StorePermission = {
  STORE_VIEW: 'STORE_VIEW',
  STORE_EDIT: 'STORE_EDIT',
  PRODUCT_VIEW: 'PRODUCT_VIEW',
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_EDIT: 'PRODUCT_EDIT',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  ORDER_VIEW: 'ORDER_VIEW',
  ORDER_UPDATE: 'ORDER_UPDATE',
  CUSTOMER_VIEW: 'CUSTOMER_VIEW',
  ANALYTICS_VIEW: 'ANALYTICS_VIEW',
  THEME_EDIT: 'THEME_EDIT',
  SETTINGS_EDIT: 'SETTINGS_EDIT',
  TEAM_MANAGE: 'TEAM_MANAGE',
} as const;
export type StorePermission = (typeof StorePermission)[keyof typeof StorePermission];

export const CreatorType = {
  VTUBER: 'VTUBER',
  STREAMER: 'STREAMER',
  ARTIST: 'ARTIST',
  ILLUSTRATOR: 'ILLUSTRATOR',
  WRITER: 'WRITER',
  MUSICIAN: 'MUSICIAN',
  CONTENT_CREATOR: 'CONTENT_CREATOR',
  BRAND: 'BRAND',
  PERSONAL_SHOP: 'PERSONAL_SHOP',
  OTHER: 'OTHER',
} as const;
export type CreatorType = (typeof CreatorType)[keyof typeof CreatorType];

export const StoreStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type StoreStatus = (typeof StoreStatus)[keyof typeof StoreStatus];

export const ThemePreset = {
  MINIMAL: 'MINIMAL',
  CUTE: 'CUTE',
  DARK: 'DARK',
  GAMING: 'GAMING',
  PASTEL: 'PASTEL',
  EDITORIAL: 'EDITORIAL',
  CYBER: 'CYBER',
  ARTIST_PORTFOLIO: 'ARTIST_PORTFOLIO',
  VTUBER: 'VTUBER',
  CLEAN_COMMERCE: 'CLEAN_COMMERCE',
} as const;
export type ThemePreset = (typeof ThemePreset)[keyof typeof ThemePreset];

export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const FulfillmentType = {
  MANUAL: 'MANUAL',
  STOCK: 'STOCK',
  PRINT_ON_DEMAND: 'PRINT_ON_DEMAND',
  DROPSHIP: 'DROPSHIP',
  DIGITAL: 'DIGITAL',
} as const;
export type FulfillmentType = (typeof FulfillmentType)[keyof typeof FulfillmentType];

export const InventoryMode = {
  NOT_TRACKED: 'NOT_TRACKED',
  TRACKED: 'TRACKED',
  TRACKED_ALLOW_BACKORDER: 'TRACKED_ALLOW_BACKORDER',
} as const;
export type InventoryMode = (typeof InventoryMode)[keyof typeof InventoryMode];

export const CollectionStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
} as const;
export type CollectionStatus = (typeof CollectionStatus)[keyof typeof CollectionStatus];

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  FULFILLED: 'FULFILLED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const FulfillmentStatus = {
  UNFULFILLED: 'UNFULFILLED',
  PROCESSING: 'PROCESSING',
  FULFILLED: 'FULFILLED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
} as const;
export type FulfillmentStatus = (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus];

export const DiscountType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  FREE_SHIPPING: 'FREE_SHIPPING',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const SectionType = {
  HEADER: 'HEADER',
  HERO: 'HERO',
  FEATURED_PRODUCTS: 'FEATURED_PRODUCTS',
  PRODUCT_GRID: 'PRODUCT_GRID',
  COLLECTION_LIST: 'COLLECTION_LIST',
  IMAGE_BANNER: 'IMAGE_BANNER',
  TEXT_BLOCK: 'TEXT_BLOCK',
  IMAGE_WITH_TEXT: 'IMAGE_WITH_TEXT',
  GALLERY: 'GALLERY',
  VIDEO: 'VIDEO',
  SOCIAL_LINKS: 'SOCIAL_LINKS',
  NEWSLETTER: 'NEWSLETTER',
  FOOTER: 'FOOTER',
} as const;
export type SectionType = (typeof SectionType)[keyof typeof SectionType];

export const MediaOwnerType = {
  STORE: 'STORE',
  PRODUCT: 'PRODUCT',
  VARIANT: 'VARIANT',
  COLLECTION: 'COLLECTION',
  THEME: 'THEME',
} as const;
export type MediaOwnerType = (typeof MediaOwnerType)[keyof typeof MediaOwnerType];

export const FulfillmentProviderKind = {
  MANUAL: 'MANUAL',
  PRINTFUL: 'PRINTFUL',
  PRINTIFY: 'PRINTIFY',
  CJ_DROPSHIPPING: 'CJ_DROPSHIPPING',
  CUSTOM: 'CUSTOM',
} as const;
export type FulfillmentProviderKind =
  (typeof FulfillmentProviderKind)[keyof typeof FulfillmentProviderKind];

export const PaymentChannelType = {
  /** PromptPay QR keyed to a Thai mobile number. */
  PROMPTPAY_PHONE: 'PROMPTPAY_PHONE',
  /** PromptPay QR keyed to a national ID or corporate tax ID. */
  PROMPTPAY_NATIONAL_ID: 'PROMPTPAY_NATIONAL_ID',
  /** PromptPay QR keyed to an e-wallet id — TrueMoney and similar. */
  PROMPTPAY_EWALLET: 'PROMPTPAY_EWALLET',
  /** Account name and number shown as text; no QR. */
  BANK_TRANSFER: 'BANK_TRANSFER',
  /** A QR image the creator uploaded themselves. */
  CUSTOM_QR: 'CUSTOM_QR',
} as const;
export type PaymentChannelType = (typeof PaymentChannelType)[keyof typeof PaymentChannelType];

export const PaymentProofStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type PaymentProofStatus = (typeof PaymentProofStatus)[keyof typeof PaymentProofStatus];
