'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StoreSwitcher } from './store-switcher';
import { FOOTER_ITEMS, NAV_GROUPS, type NavItem } from './nav-config';
import { useActiveStoreSummary } from '@/hooks/use-active-store';
import { cn, storeUrl } from '@/lib/utils';
import { clientEnv } from '@/lib/env';

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  // `/dashboard/store` must not light up while on `/dashboard/store/editor`.
  if (href === '/dashboard/store') return pathname === '/dashboard/store';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground',
      )}
    >
      <item.icon
        className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.soon && (
        <Badge variant="neutral" className="px-1.5 py-0 text-[0.625rem]">
          Soon
        </Badge>
      )}
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const store = useActiveStoreSummary();

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2 px-1">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-xl shadow-sm">
          <Sparkles className="size-4" />
        </span>
        <span className="font-display truncate text-base font-bold tracking-tight">
          {clientEnv.platformName}
        </span>
      </div>

      <StoreSwitcher />

      <nav className="flex-1 space-y-5 overflow-y-auto pb-2">
        {NAV_GROUPS.map((group, index) => {
          const visible = group.items.filter(
            (item) => !item.permission || (store?.permissions.includes(item.permission) ?? false),
          );
          if (visible.length === 0) return null;

          return (
            <div key={group.label ?? `group-${index}`} className="space-y-1">
              {group.label && (
                <p className="text-muted-foreground/80 px-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em]">
                  {group.label}
                </p>
              )}
              {visible.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          );
        })}
      </nav>

      <div className="space-y-1">
        <Separator />
        {store && (
          <a
            href={storeUrl(store.handle)}
            target="_blank"
            rel="noreferrer"
            className="text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors"
          >
            <ExternalLink className="text-muted-foreground size-4" />
            View store
          </a>
        )}
        {FOOTER_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="border-border bg-sidebar hidden w-60 shrink-0 border-r p-4 lg:block">
      <div className="sticky top-3 h-[calc(100dvh-1.5rem)]">
        <SidebarContent />
      </div>
    </aside>
  );
}
