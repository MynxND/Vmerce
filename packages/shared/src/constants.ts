import { CreatorType } from '@cc/types';

export const API_VERSION = 'v1';

export const CREATOR_TYPE_OPTIONS: Array<{
  value: CreatorType;
  label: string;
  hint: string;
  emoji: string;
}> = [
  {
    value: CreatorType.VTUBER,
    label: 'VTuber',
    hint: 'Model merch, acrylics, voice packs',
    emoji: '🎀',
  },
  {
    value: CreatorType.STREAMER,
    label: 'Streamer',
    hint: 'Emote drops, apparel, sub goals',
    emoji: '🎮',
  },
  {
    value: CreatorType.ARTIST,
    label: 'Artist',
    hint: 'Prints, originals, commissions',
    emoji: '🎨',
  },
  {
    value: CreatorType.ILLUSTRATOR,
    label: 'Illustrator',
    hint: 'Stickers, zines, art books',
    emoji: '✏️',
  },
  {
    value: CreatorType.WRITER,
    label: 'Writer',
    hint: 'Books, ebooks, signed editions',
    emoji: '📚',
  },
  {
    value: CreatorType.MUSICIAN,
    label: 'Musician',
    hint: 'Vinyl, tour merch, digital albums',
    emoji: '🎧',
  },
  {
    value: CreatorType.CONTENT_CREATOR,
    label: 'Content Creator',
    hint: 'Apparel, accessories, bundles',
    emoji: '📸',
  },
  {
    value: CreatorType.BRAND,
    label: 'Brand',
    hint: 'Small business or studio storefront',
    emoji: '🏷️',
  },
  {
    value: CreatorType.PERSONAL_SHOP,
    label: 'Personal Shop',
    hint: 'Just selling a few things',
    emoji: '🛍️',
  },
  { value: CreatorType.OTHER, label: 'Other', hint: 'Something else entirely', emoji: '✨' },
];

/**
 * Phase 1 ships flat-rate shipping only. Real rates come from the fulfillment
 * provider adapters in Phase 3 (`getShippingRates`).
 */
export interface ShippingOption {
  id: string;
  label: string;
  description: string;
  /** Minor currency units. */
  amount: number;
  estimatedDays: string;
}

export const DEFAULT_SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'standard',
    label: 'Standard shipping',
    description: 'Tracked domestic delivery',
    amount: 5000,
    estimatedDays: '3-5 business days',
  },
  {
    id: 'express',
    label: 'Express shipping',
    description: 'Priority handling',
    amount: 12000,
    estimatedDays: '1-2 business days',
  },
  {
    id: 'pickup',
    label: 'Local pickup',
    description: 'Collect at an event or studio',
    amount: 0,
    estimatedDays: 'Arranged by the creator',
  },
];

export function findShippingOption(id: string): ShippingOption | undefined {
  return DEFAULT_SHIPPING_OPTIONS.find((option) => option.id === id);
}

export const PRODUCT_CATEGORIES = [
  'Phone Cases',
  'T-Shirts',
  'Hoodies',
  'Tote Bags',
  'Posters',
  'Stickers',
  'Acrylic Stands',
  'Acrylic Keychains',
  'Photocards',
  'Art Prints',
  'Mugs',
  'Mousepads',
  'Books',
  'Digital',
  'Other',
] as const;
