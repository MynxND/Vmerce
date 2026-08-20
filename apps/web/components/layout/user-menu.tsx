'use client';

import Link from 'next/link';
import { ExternalLink, LogOut, Settings, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout, useSession } from '@/hooks/use-session';
import { useActiveStoreSummary } from '@/hooks/use-active-store';
import { initials, storeUrl } from '@/lib/utils';

export function UserMenu() {
  const { user } = useSession();
  const store = useActiveStoreSummary();
  const logout = useLogout();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_oklab,var(--ring)_30%,transparent)]">
        <Avatar>
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback>{initials(user.name ?? user.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="text-foreground block truncate text-sm font-medium normal-case tracking-normal">
            {user.name ?? 'Creator'}
          </span>
          <span className="text-muted-foreground block truncate text-xs font-normal normal-case tracking-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {store && (
          <DropdownMenuItem asChild>
            <a href={storeUrl(store.handle)} target="_blank" rel="noreferrer">
              <ExternalLink />
              View store
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <UserRound />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings />
            Store settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => void logout()}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
