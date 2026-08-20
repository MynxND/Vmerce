'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSessionBootstrap, useSession } from '@/hooks/use-session';
import { useAuthStore } from '@/stores/auth-store';

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground flex min-h-dvh flex-col items-center justify-center gap-3">
      <Loader2 className="size-5 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Wraps authenticated areas: bootstraps the session, then guards the route. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  useSessionBootstrap();
  const router = useRouter();
  const { status, user } = useSession();

  React.useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  React.useEffect(() => {
    // A registered user with no store has not finished onboarding yet.
    if (status === 'authenticated' && user && !user.onboardedAt) router.replace('/onboarding');
  }, [status, user, router]);

  if (status !== 'authenticated') return <FullScreenLoader label="Checking your session…" />;
  return <>{children}</>;
}

/** For /login and /register: sends already-signed-in visitors onward. */
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  useSessionBootstrap();
  const router = useRouter();
  const { status, user } = useSession();
  const stores = useAuthStore((state) => state.stores);

  React.useEffect(() => {
    if (status !== 'authenticated') return;
    router.replace(user?.onboardedAt && stores.length > 0 ? '/dashboard' : '/onboarding');
  }, [status, user, stores.length, router]);

  if (status === 'idle' || status === 'loading') return <FullScreenLoader label="Loading…" />;
  return <>{children}</>;
}

/** Onboarding needs a session but must not bounce back to /onboarding. */
export function RequireSession({ children }: { children: React.ReactNode }) {
  useSessionBootstrap();
  const router = useRouter();
  const { status } = useSession();

  React.useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') return <FullScreenLoader label="Checking your session…" />;
  return <>{children}</>;
}
