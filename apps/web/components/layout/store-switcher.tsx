'use client';

import Link from 'next/link';

import { Check, ChevronsUpDown, Plus, Store } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/auth-store';
import { useActiveStoreSummary } from '@/hooks/use-active-store';
import { initials } from '@/lib/utils';

export function StoreSwitcher() {
  const stores = useAuthStore((state) => state.stores);
  const setActiveStore = useAuthStore((state) => state.setActiveStore);
  const active = useActiveStoreSummary();

  if (!active) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="border-border bg-card hover:bg-muted flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors">
        <Avatar className="size-7 rounded-lg">
          {active.logoUrl && <AvatarImage src={active.logoUrl} alt="" />}
          <AvatarFallback className="rounded-lg">{initials(active.name, 'S')}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{active.name}</span>
          <span className="text-muted-foreground block truncate text-xs">@{active.handle}</span>
        </span>
        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Your shops</DropdownMenuLabel>
        {stores.map((store) => (
          <DropdownMenuItem key={store.id} onSelect={() => setActiveStore(store.id)}>
            <Store />
            <span className="min-w-0 flex-1 truncate">{store.name}</span>
            {store.id === active.id && <Check className="text-primary size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/store/new">
            <Plus />
            New shop
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
