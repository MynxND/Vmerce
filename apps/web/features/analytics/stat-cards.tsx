'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { DashboardStatDto } from '@cc/types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLocale, type CopyKey } from '@/lib/i18n';

function ChangeIndicator({ change }: { change: number | null }) {
  const { t } = useLocale();
  if (change === null) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <Minus className="size-3" /> {t('noPriorData')}
      </span>
    );
  }

  const positive = change > 0.05;
  const negative = change < -0.05;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        positive && 'text-[color-mix(in_oklab,var(--success)_72%,var(--foreground))]',
        negative && 'text-destructive',
        !positive && !negative && 'text-muted-foreground',
      )}
    >
      <Icon className="size-3" />
      {change > 0 ? '+' : ''}
      {change.toFixed(1)}%
      <span className="text-muted-foreground font-normal">{t('vsPrevious')}</span>
    </span>
  );
}

export function StatCards({ stats, loading }: { stats: DashboardStatDto[]; loading?: boolean }) {
  const { t } = useLocale();
  const statKeys: Record<string, CopyKey> = { revenue: 'revenue', orders: 'orders', visitors: 'visitors', conversionRate: 'conversionRate', conversion: 'conversionRate' };
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-28" />
            <Skeleton className="mt-3 h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.key} className="p-5">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            {statKeys[stat.key] ? t(statKeys[stat.key]!) : stat.label}
          </p>
          <p className="font-display mt-2 text-2xl font-bold tracking-tight">{stat.formatted}</p>
          <p className="mt-2">
            <ChangeIndicator change={stat.changePercent} />
          </p>
        </Card>
      ))}
    </div>
  );
}
