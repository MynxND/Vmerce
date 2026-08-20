import type {
  CollectionStatus,
  PaymentChannelType,
  PaymentProofStatus,
  CreatorType,
  DiscountType,
  FulfillmentStatus,
  FulfillmentType,
  InventoryMode,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  SectionType,
  StorePermission,
  StoreStatus,
  ThemePreset,
  UserRole,
} from './enums';

/**
 * Wire-format DTOs. Money is always an integer amount in the smallest currency
 * unit (satang / cents) so no floating point rounding ever reaches an order.
 */
export type Money = number;

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  onboardedAt: string | null;
  createdAt: string;
}

export interface AuthTokensDto {
  accessToken: string;
  /** Also set as an httpOnly cookie; returned for non-browser clients. */
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSessionDto {
  user: UserDto;
  tokens: AuthTokensDto;
  stores: StoreSummaryDto[];
}

export interface StoreSummaryDto {
  id: string;
  name: string;
  handle: string;
  logoUrl: string | null;
  status: StoreStatus;
  permissions: StorePermission[];
}

export interface StoreDto {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  creatorType: CreatorType;
  logoUrl: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  status: StoreStatus;
  currency: string;
  country: string | null;
  customDomain: string | null;
  socialLinks: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface StoreThemeDto {
  id: string;
  storeId: string;
  preset: ThemePreset;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  effects: ThemeEffects;
  buttonStyle: 'ROUNDED' | 'SQUARE' | 'PILL';
  colorMode: 'LIGHT' | 'DARK';
  faviconUrl: string | null;
  updatedAt: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  accent: string;
  border: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  fontScale: number;
}

export interface ThemeLayout {
  contentWidth: number;
  productColumns: number;
  spacing: number;
}

export interface ThemeEffects {
  radius: number;
  shadow: 'none' | 'soft' | 'medium' | 'strong';
  animations: boolean;
}

export interface StorePageDto {
  id: string;
  storeId: string;
  slug: string;
  title: string;
  isHome: boolean;
  sections: StoreSectionDto[];
}

export interface StoreSectionDto {
  id: string;
  pageId: string;
  type: SectionType;
  position: number;
  visible: boolean;
  settings: Record<string, unknown>;
}

export interface MediaDto {
  id: string;
  storeId: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
}

export interface ProductMediaDto {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface ProductOptionValueDto {
  id: string;
  value: string;
  position: number;
  /** Optional grouping label, e.g. device brand "Apple" for "iPhone 17 Pro". */
  group: string | null;
}

export interface ProductOptionDto {
  id: string;
  name: string;
  position: number;
  values: ProductOptionValueDto[];
}

export interface ProductVariantDto {
  id: string;
  productId: string;
  sku: string | null;
  title: string;
  price: Money;
  compareAtPrice: Money | null;
  cost: Money | null;
  stock: number;
  enabled: boolean;
  imageUrl: string | null;
  supplierSku: string | null;
  /** Option value ids that identify this variant, in option order. */
  optionValueIds: string[];
  optionValues: string[];
}

export interface ProductDto {
  id: string;
  storeId: string;
  title: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  category: string | null;
  price: Money;
  compareAtPrice: Money | null;
  cost: Money | null;
  currency: string;
  inventoryMode: InventoryMode;
  fulfillmentType: FulfillmentType;
  seoTitle: string | null;
  seoDescription: string | null;
  metadata: Record<string, unknown>;
  media: ProductMediaDto[];
  options: ProductOptionDto[];
  variants: ProductVariantDto[];
  collectionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItemDto {
  id: string;
  title: string;
  slug: string;
  status: ProductStatus;
  price: Money;
  compareAtPrice: Money | null;
  currency: string;
  thumbnailUrl: string | null;
  variantCount: number;
  totalStock: number;
  fulfillmentType: FulfillmentType;
  updatedAt: string;
}

export interface CollectionDto {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  status: CollectionStatus;
  position: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemDto {
  id: string;
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  variantTitle: string;
  imageUrl: string | null;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
  available: boolean;
}

export interface CartDto {
  id: string;
  token: string;
  storeId: string;
  storeHandle: string;
  currency: string;
  items: CartItemDto[];
  discountCode: string | null;
  subtotal: Money;
  discountTotal: Money;
  shippingTotal: Money;
  total: Money;
  itemCount: number;
}

export interface AddressDto {
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

export interface OrderItemDto {
  id: string;
  productId: string | null;
  variantId: string | null;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  imageUrl: string | null;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  storeId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  currency: string;
  subtotal: Money;
  discountTotal: Money;
  shippingTotal: Money;
  taxTotal: Money;
  total: Money;
  discountCode: string | null;
  email: string;
  phone: string | null;
  customerName: string;
  note: string | null;
  paymentProvider: string;
  paymentReference: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  items: OrderItemDto[];
  shippingAddress: AddressDto | null;
  customer: { id: string; email: string; name: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListItemDto {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  itemSummary: string;
  itemCount: number;
  total: Money;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
}

export interface CustomerDto {
  id: string;
  storeId: string;
  email: string;
  name: string | null;
  phone: string | null;
  ordersCount: number;
  totalSpent: Money;
  lastOrderAt: string | null;
  note: string | null;
  createdAt: string;
}

export interface DiscountDto {
  id: string;
  storeId: string;
  code: string;
  type: DiscountType;
  /** Percent for PERCENTAGE, minor units for FIXED_AMOUNT, unused otherwise. */
  value: number;
  minimumSpend: Money | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  productIds: string[];
  collectionIds: string[];
  /** Derived server-side from active + window + usage limit. */
  status: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'USED_UP' | 'DISABLED';
  createdAt: string;
}

export interface TeamMemberDto {
  id: string;
  storeId: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  extraPermissions: StorePermission[];
  /** Role matrix plus extra grants — what the API actually enforces. */
  effectivePermissions: StorePermission[];
  isOwner: boolean;
  /** Set once the invited user has a real account attached. */
  acceptedAt: string | null;
  invitedEmail: string | null;
  createdAt: string;
}

export interface DashboardStatDto {
  key: 'revenue' | 'orders' | 'visitors' | 'conversionRate';
  label: string;
  value: number;
  formatted: string;
  changePercent: number | null;
}

export interface DashboardSeriesPointDto {
  date: string;
  revenue: Money;
  orders: number;
}

export interface DashboardTopProductDto {
  productId: string;
  title: string;
  thumbnailUrl: string | null;
  orders: number;
  revenue: Money;
}

export interface DashboardOverviewDto {
  currency: string;
  range: { from: string; to: string; days: number };
  stats: DashboardStatDto[];
  series: DashboardSeriesPointDto[];
  recentOrders: OrderListItemDto[];
  topProducts: DashboardTopProductDto[];
}

export interface StorefrontStoreDto {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  creatorType: CreatorType;
  logoUrl: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  currency: string;
  socialLinks: Record<string, string>;
  theme: StoreThemeDto;
}

export interface PaymentChannelDto {
  id: string;
  storeId: string;
  type: PaymentChannelType;
  label: string;
  /** Name on the account, shown to the buyer so they can confirm the recipient. */
  accountName: string;
  /** Phone / national ID / e-wallet id. Masked on public storefront responses. */
  proxyValue: string | null;
  bankCode: string | null;
  bankAccountNumber: string | null;
  qrImageUrl: string | null;
  instructions: string | null;
  enabled: boolean;
  isDefault: boolean;
  position: number;
  /** True when this channel can produce a scannable QR for an exact amount. */
  supportsQr: boolean;
  createdAt: string;
}

/** What the storefront needs to render a channel at checkout. Never leaks a
 * full account identifier for channels the buyer does not choose. */
export interface StorefrontPaymentChannelDto {
  id: string;
  type: PaymentChannelType;
  label: string;
  accountName: string;
  bankName: string | null;
  /** Partially masked, e.g. `081-xxx-5678`. */
  maskedIdentifier: string | null;
  instructions: string | null;
  supportsQr: boolean;
}

export interface PaymentInstructionDto {
  channelId: string;
  channelType: PaymentChannelType;
  label: string;
  accountName: string;
  bankName: string | null;
  /** Full identifier — returned only for the channel the buyer actually chose. */
  identifier: string | null;
  /** EMVCo payload string, present when `supportsQr`. */
  qrPayload: string | null;
  /** Ready-to-render SVG data URI for `qrPayload`, or the uploaded image. */
  qrImageUrl: string | null;
  amount: Money;
  currency: string;
  reference: string;
  instructions: string | null;
  /** How long the buyer has before the order is treated as abandoned. */
  expiresAt: string | null;
}

export interface PaymentProofDto {
  id: string;
  orderId: string;
  channelId: string | null;
  channelLabel: string | null;
  amount: Money;
  reference: string | null;
  slipUrl: string;
  transferredAt: string | null;
  status: PaymentProofStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}
