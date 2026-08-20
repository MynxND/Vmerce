'use client';

import * as React from 'react';
import Link from 'next/link';
import { ExternalLink, Menu, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar, SidebarContent } from './sidebar';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { useActiveStoreSummary } from '@/hooks/use-active-store';
import { storeUrl } from '@/lib/utils';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const store = useActiveStoreSummary();

  return (
    <div className="bg-background flex min-h-dvh">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-[color-mix(in_oklab,var(--background)_88%,transparent)] px-4 backdrop-blur-xl">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar p-3">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />
          {store && (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/store/editor"><Palette /> Edit website</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={storeUrl(store.handle)} target="_blank" rel="noreferrer"><ExternalLink /> Preview store</a>
              </Button>
            </div>
          )}
          <ThemeToggle />
          <UserMenu />
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-7 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
