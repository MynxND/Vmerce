/** Framework-free helpers shared by the API and the web app. */

const RESERVED_HANDLES = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'cart',
  'checkout',
  'dashboard',
  'help',
  'login',
  'logout',
  'onboarding',
  'register',
  'settings',
  'shop',
  'store',
  'support',
  'www',
]);

export function isReservedHandle(handle: string): boolean {
  return RESERVED_HANDLES.has(handle.toLowerCase());
}

/** URL-safe slug. Keeps CJK/Thai characters instead of stripping them to "". */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Uppercase A-Z0-9 token used for SKUs and discount codes. */
export function skuToken(input: string, maxLength = 6): string {
  const token = input
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase();
  return token.slice(0, maxLength) || 'X';
}

/**
 * Abbreviates a multi-word value for use as one SKU segment.
 *
 * Each word is shortened separately, and words containing digits are kept
 * longer, because those are usually what distinguishes one option value from the
 * next. Truncating the joined string instead would collapse "iPhone 17",
 * "iPhone 17 Pro" and "iPhone 17 Pro Max" onto a single "IPHONE".
 */
export function skuSegment(input: string, maxLength = 12): string {
  const words = input
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);

  const token = words
    .map((word) => (/\d/.test(word) ? word.slice(0, 6) : word.slice(0, 3)))
    .join('');

  return token.slice(0, maxLength) || 'X';
}

export function buildSku(productTitle: string, optionValues: readonly string[]): string {
  const head = skuToken(productTitle.split(/\s+/).at(-1) ?? productTitle, 6);
  const tail = optionValues.map((value) => skuSegment(value));
  return [head, ...tail].join('-');
}

/**
 * Returns a function that makes each SKU it is handed unique within one batch by
 * appending `-2`, `-3`, ... on collision.
 *
 * Abbreviation is lossy, so distinct option values can still produce the same
 * token ("Pink" and "Pinkish" both start "PIN"). Anything writing variants —
 * the product service, the seed script, a future importer — has to run its SKUs
 * through this or risk tripping the `(storeId, sku)` unique constraint.
 */
export function skuDeduper(taken: Iterable<string> = []): (sku: string) => string {
  const used = new Set(taken);

  return (sku: string): string => {
    if (!used.has(sku)) {
      used.add(sku);
      return sku;
    }

    let suffix = 2;
    let candidate = `${sku}-${suffix}`;
    while (used.has(candidate)) {
      suffix += 1;
      candidate = `${sku}-${suffix}`;
    }
    used.add(candidate);
    return candidate;
  };
}

/** Cartesian product of option value lists, preserving option order. */
export function cartesian<T>(lists: readonly T[][]): T[][] {
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((row) => list.map((item) => [...row, item])),
    [[]],
  );
}

export interface FormatMoneyOptions {
  currency?: string;
  locale?: string;
  /** Hide `.00` on whole amounts. */
  compactZero?: boolean;
}

/** `amount` is always an integer in the smallest currency unit. */
export function formatMoney(amount: number, options: FormatMoneyOptions = {}): string {
  const { currency = 'THB', locale = 'en-US', compactZero = false } = options;
  const value = amount / 100;
  const fractionDigits = compactZero && Number.isInteger(value) ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(fractionDigits)}%`;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Random, URL-safe, lowercase token. Not for anything security critical. */
export function randomToken(length = 24): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let index = 0; index < length; index += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
