'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';
import { setSessionExpiredHandler } from '@/services/session-token';

/**
 * Restores the session on a full page load.
 *
 * The access token lives only in memory, so every hard navigation exchanges the
 * httpOnly refresh cookie for a fresh one exactly once.
 */
export function useSessionBootstrap(): void {
  const status = useAuthStore((state) => state.status);
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const clear = useAuthStore((state) => state.clear);

  React.useEffect(() => {
    setSessionExpiredHandler(() => clear());
    return () => setSessionExpiredHandler(null);
  }, [clear]);

  React.useEffect(() => {
    if (status !== 'idle') return;
    let cancelled = false;
    setStatus('loading');

    authApi
      .refresh()
      .then((session) => {
        if (!cancelled) setSession(session);
      })
      .catch(() => {
        if (!cancelled) clear();
      });

    return () => {
      cancelled = true;
    };
  }, [status, setSession, setStatus, clear]);
}

export function useSession() {
  const { status, user, stores } = useAuthStore();
  return { status, user, stores, isAuthenticated: status === 'authenticated' };
}

export function useLogout() {
  const router = useRouter();
  const clear = useAuthStore((state) => state.clear);

  return React.useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    clear();
    router.replace('/login');
  }, [clear, router]);
}
