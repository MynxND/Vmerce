import type { Request, Response } from 'express';
import type { AddCartItemInput, UpdateCartItemInput } from '@cc/shared';
import { CART_TOKEN_COOKIE } from '../config/constants';
import { env } from '../config/env';
import { cartService } from '../services/cart.service';
import { ApiError } from '../utils/errors';
import { success } from '../utils/response';

const CART_COOKIE_MAX_AGE = 30 * 86_400_000;

function persistToken(res: Response, token: string): void {
  res.cookie(CART_TOKEN_COOKIE, token, {
    httpOnly: false, // The storefront reads this from client components too.
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

function requireToken(req: Request): string {
  if (!req.cartToken) throw ApiError.notFound('Cart not found', 'CART_NOT_FOUND');
  return req.cartToken;
}

export const cartController = {
  /** Idempotent: returns the visitor's cart for this store, creating it if needed. */
  async getOrCreate(req: Request, res: Response): Promise<void> {
    const cart = await cartService.getOrCreate(req.params.handle!, req.cartToken);
    persistToken(res, cart.token);
    success(res, cart);
  },

  async addItem(req: Request, res: Response): Promise<void> {
    // Adding an item is the first action for most visitors, so create on demand.
    const existing = await cartService.getOrCreate(req.params.handle!, req.cartToken);
    persistToken(res, existing.token);
    success(
      res,
      await cartService.addItem(existing.token, req.body as AddCartItemInput),
      'Added to cart',
    );
  },

  async updateItem(req: Request, res: Response): Promise<void> {
    const { quantity } = req.body as UpdateCartItemInput;
    success(res, await cartService.updateItem(requireToken(req), req.params.itemId!, quantity));
  },

  async removeItem(req: Request, res: Response): Promise<void> {
    success(res, await cartService.removeItem(requireToken(req), req.params.itemId!));
  },

  async applyDiscount(req: Request, res: Response): Promise<void> {
    const { code } = req.body as { code: string | null };
    success(res, await cartService.applyDiscount(requireToken(req), code));
  },
};
