'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CartDto } from '@cc/types';
import { cartKeys, storefrontApi } from './api';
import { errorMessage } from '@/lib/api-error';

/**
 * Shared cart hook for the storefront.
 *
 * The cart lives server-side, keyed by an httpOnly-free cookie the API sets, so
 * every component reads the same TanStack Query cache rather than mirroring cart
 * state in the client.
 */
export function useCart(handle: string) {
  return useQuery({
    queryKey: cartKeys.cart(handle),
    queryFn: () => storefrontApi.getCart(handle),
    staleTime: 5_000,
  });
}

export function useCartMutations(handle: string) {
  const queryClient = useQueryClient();

  const write = (cart: CartDto) => queryClient.setQueryData(cartKeys.cart(handle), cart);
  const fail = (error: unknown) => toast.error(errorMessage(error, 'Could not update your cart'));

  const addItem = useMutation({
    mutationFn: (input: { variantId: string; quantity: number }) =>
      storefrontApi.addItem(handle, input),
    onSuccess: (cart) => {
      write(cart);
      toast.success('Added to cart');
    },
    onError: fail,
  });

  const updateItem = useMutation({
    mutationFn: (input: { itemId: string; quantity: number }) =>
      storefrontApi.updateItem(handle, input.itemId, input.quantity),
    onSuccess: write,
    onError: fail,
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => storefrontApi.removeItem(handle, itemId),
    onSuccess: write,
    onError: fail,
  });

  const applyDiscount = useMutation({
    mutationFn: (code: string | null) => storefrontApi.applyDiscount(handle, code),
    onSuccess: (cart) => {
      write(cart);
      toast.success(cart.discountCode ? 'Discount applied' : 'Discount removed');
    },
    onError: fail,
  });

  return { addItem, updateItem, removeItem, applyDiscount };
}
