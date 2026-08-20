'use client';

import { useAuthStore } from '@/stores/auth-store';
import type { StorePermission } from '@cc/types';

/**
 * The store the dashboard is currently scoped to. Every dashboard query keys off
 * this id, so switching stores refetches everything cleanly.
 */
export function useActiveStoreId(): string | null {
  const { stores, activeStoreId } = useAuthStore();
  if (activeStoreId && stores.some((store) => store.id === activeStoreId)) return activeStoreId;
  return stores[0]?.id ?? null;
}

export function useActiveStoreSummary() {
  const { stores } = useAuthStore();
  const activeId = useActiveStoreId();
  return stores.find((store) => store.id === activeId) ?? null;
}

export function useHasPermission(permission: StorePermission): boolean {
  const store = useActiveStoreSummary();
  return store?.permissions.includes(permission) ?? false;
}
