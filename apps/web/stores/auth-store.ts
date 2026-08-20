'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSessionDto, StoreSummaryDto, UserDto } from '@cc/types';
import { setAccessToken } from '@/services/session-token';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  status: AuthStatus;
  user: UserDto | null;
  stores: StoreSummaryDto[];
  /** Persisted so the dashboard reopens on the store the creator last used. */
  activeStoreId: string | null;

  setSession: (session: AuthSessionDto) => void;
  setUser: (user: UserDto, stores: StoreSummaryDto[]) => void;
  setStatus: (status: AuthStatus) => void;
  setActiveStore: (storeId: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      user: null,
      stores: [],
      activeStoreId: null,

      setSession: (session) => {
        setAccessToken(session.tokens.accessToken);
        const activeStoreId =
          get().activeStoreId && session.stores.some((store) => store.id === get().activeStoreId)
            ? get().activeStoreId
            : (session.stores[0]?.id ?? null);
        set({ status: 'authenticated', user: session.user, stores: session.stores, activeStoreId });
      },

      setUser: (user, stores) => {
        const current = get().activeStoreId;
        const activeStoreId =
          current && stores.some((store) => store.id === current)
            ? current
            : (stores[0]?.id ?? null);
        set({ status: 'authenticated', user, stores, activeStoreId });
      },

      setStatus: (status) => set({ status }),
      setActiveStore: (storeId) => set({ activeStoreId: storeId }),

      clear: () => {
        setAccessToken(null);
        set({ status: 'anonymous', user: null, stores: [], activeStoreId: null });
      },
    }),
    {
      name: 'cc.session',
      // Only the store selection survives a reload; tokens never touch storage.
      partialize: (state) => ({ activeStoreId: state.activeStoreId }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useActiveStore(): StoreSummaryDto | null {
  const { stores, activeStoreId } = useAuthStore();
  return stores.find((store) => store.id === activeStoreId) ?? stores[0] ?? null;
}
