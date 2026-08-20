export const API_PREFIX = '/api/v1';

export const REFRESH_TOKEN_COOKIE = 'cc_refresh_token';
export const CART_TOKEN_COOKIE = 'cc_cart_token';

export const COOKIE_PATHS = {
  refresh: `${API_PREFIX}/auth`,
} as const;

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
] as const;
