import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Minor units → editable major-unit string for price inputs. */
export function minorToInput(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return (amount / 100).toFixed(2);
}

/** Major-unit string from a price input → integer minor units. */
export function inputToMinor(value: string): number {
  const parsed = Number.parseFloat(value.replace(/,/g, ''));
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function initials(name: string | null | undefined, fallback = '?'): string {
  if (!name?.trim()) return fallback;
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, { hour: '2-digit', minute: '2-digit' });
}

export function relativeTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60_000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
}

/** Strips the leading `@` from a storefront route segment. */
export function normalizeHandleParam(param: string): string {
  return decodeURIComponent(param).replace(/^@/, '').toLowerCase();
}

export function storeUrl(handle: string, path = ''): string {
  return `/@${handle}${path}`;
}
