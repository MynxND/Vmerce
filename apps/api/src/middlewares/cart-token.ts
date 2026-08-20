import type { RequestHandler } from 'express';
import { CART_TOKEN_COOKIE } from '../config/constants';

/**
 * Storefront requests carry their anonymous cart token either as a cookie (the
 * browser) or as `X-Cart-Token` (server components / non-browser clients).
 */
export const resolveCartToken: RequestHandler = (req, _res, next) => {
  const header = req.header('x-cart-token');
  const cookie = (req.cookies as Record<string, string> | undefined)?.[CART_TOKEN_COOKIE];
  const token = header?.trim() || cookie?.trim();
  if (token) req.cartToken = token;
  next();
};
