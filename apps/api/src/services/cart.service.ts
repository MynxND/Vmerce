import type { CartDto } from '@cc/types';
import { InventoryMode } from '@cc/types';
import { randomToken, type AddCartItemInput } from '@cc/shared';
import { cartRepository, type CartWithRelations } from '../repositories/cart.repository';
import { productRepository } from '../repositories/product.repository';
import { storeRepository } from '../repositories/store.repository';
import { discountRepository } from '../repositories/discount.repository';
import { toCartDto } from '../mappers/cart.mapper';
import { ApiError } from '../utils/errors';
import { priceCart } from './pricing.service';

const CART_TTL_DAYS = 30;

function expiry(): Date {
  return new Date(Date.now() + CART_TTL_DAYS * 86_400_000);
}

async function present(cart: CartWithRelations): Promise<CartDto> {
  const totals = await priceCart(cart).catch(async (error) => {
    // A code that became invalid after it was applied should not break the cart.
    if (cart.discountCode) {
      const cleared = await cartRepository.update(cart.id, { discountCode: null });
      return priceCart(cleared);
    }
    throw error;
  });
  return toCartDto(cart, totals);
}

async function loadCart(token: string): Promise<CartWithRelations> {
  const cart = await cartRepository.findByToken(token);
  if (!cart) throw ApiError.notFound('Cart not found', 'CART_NOT_FOUND');
  return cart;
}

export const cartService = {
  /** Returns the existing cart for the token, or a fresh empty one for the store. */
  async getOrCreate(storeHandle: string, token: string | undefined): Promise<CartDto> {
    const store = await storeRepository.findByHandle(storeHandle);
    if (!store) throw ApiError.notFound('Store not found', 'STORE_NOT_FOUND');

    if (token) {
      const existing = await cartRepository.findByToken(token);
      // A token from a different store must not leak across storefronts.
      if (existing && existing.storeId === store.id) return present(existing);
    }

    const created = await cartRepository.create({
      token: randomToken(32),
      expiresAt: expiry(),
      store: { connect: { id: store.id } },
    });
    return present(created);
  },

  async get(token: string): Promise<CartDto> {
    return present(await loadCart(token));
  },

  async addItem(token: string, input: AddCartItemInput): Promise<CartDto> {
    const cart = await loadCart(token);

    const variant = await productRepository.findVariantForStore(cart.storeId, input.variantId);
    if (!variant) throw ApiError.notFound('That variant is not available', 'VARIANT_NOT_FOUND');
    if (!variant.enabled || variant.product.status !== 'ACTIVE') {
      throw ApiError.badRequest('That variant is not available for sale');
    }

    const alreadyInCart = cart.items.find((item) => item.variantId === variant.id)?.quantity ?? 0;
    await cartService.assertStock(variant.id, alreadyInCart + input.quantity);

    await cartRepository.upsertItem(cart.id, variant.id, input.quantity);
    return present(await loadCart(token));
  },

  async updateItem(token: string, itemId: string, quantity: number): Promise<CartDto> {
    const cart = await loadCart(token);
    const item = await cartRepository.findItem(cart.id, itemId);
    if (!item) throw ApiError.notFound('Cart item not found');

    if (quantity === 0) {
      await cartRepository.deleteItem(item.id);
    } else {
      await cartService.assertStock(item.variantId, quantity);
      await cartRepository.setItemQuantity(item.id, quantity);
    }

    return present(await loadCart(token));
  },

  async removeItem(token: string, itemId: string): Promise<CartDto> {
    const cart = await loadCart(token);
    const item = await cartRepository.findItem(cart.id, itemId);
    if (!item) throw ApiError.notFound('Cart item not found');
    await cartRepository.deleteItem(item.id);
    return present(await loadCart(token));
  },

  async applyDiscount(token: string, code: string | null): Promise<CartDto> {
    const cart = await loadCart(token);

    if (code === null) {
      return present(await cartRepository.update(cart.id, { discountCode: null }));
    }

    const discount = await discountRepository.findByCode(cart.storeId, code);
    if (!discount) throw ApiError.badRequest('That discount code is not valid', 'DISCOUNT_INVALID');

    const updated = await cartRepository.update(cart.id, { discountCode: discount.code });
    // priceCart throws with the precise reason (expired, min spend, ...).
    const totals = await priceCart(updated).catch(async (error) => {
      await cartRepository.update(cart.id, { discountCode: null });
      throw error;
    });
    return toCartDto(updated, totals);
  },

  /** Shared stock check used by both the cart and checkout. */
  async assertStock(variantId: string, desiredQuantity: number): Promise<void> {
    const row = await productRepository.findVariantStock(variantId);
    if (!row) throw ApiError.notFound('That variant is not available', 'VARIANT_NOT_FOUND');

    if (row.product.inventoryMode === InventoryMode.NOT_TRACKED) return;
    if (row.product.inventoryMode === InventoryMode.TRACKED_ALLOW_BACKORDER) return;

    if (row.stock < desiredQuantity) {
      throw ApiError.badRequest(
        row.stock === 0 ? 'That variant is sold out' : `Only ${row.stock} left in stock`,
        'OUT_OF_STOCK',
      );
    }
  },
};
