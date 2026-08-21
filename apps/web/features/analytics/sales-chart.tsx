'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '@cc/shared';
import type { DashboardSeriesPointDto } from '@cc/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/lib/i18n';

type Metric = 'revenue' | 'orders';

interface SalesChartProps {
  series: DashboardSeriesPointDto[];
  currency: string;
}

export function SalesChart({ series, currency }: SalesChartProps) {
  const [metric, setMetric] = React.useState<Metric>('revenue');
  const { locale, t } = useLocale();
  const dateLocale = locale === 'th' ? 'th-TH' : locale === 'ja' ? 'ja-JP' : 'en-GB';

  const data = React.useMemo(
    () =>
      series.map((point) => ({
        date: point.date,
        label: new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'short' }).format(
          new Date(point.date),
        ),
        revenue: point.revenue / 100,
        orders: point.orders,
      })),
    [series, dateLocale],
  );

  const isRevenue = metric === 'revenue';

  return (
    <div className="space-y-4">
      <Tabs value={metric} onValueChange={(value) => setMetric(value as Metric)}>
        <TabsList>
          <TabsTrigger value="revenue">{t('revenue')}</TabsTrigger>
          <TabsTrigger value="orders">{t('orders')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              tickFormatter={(value: number) =>
                isRevenue
                  ? new Intl.NumberFormat(dateLocale, { notation: 'compact' }).format(value)
                  : String(value)
              }
            />
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: 'var(--shadow-pop)',
              }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: 4 }}
              formatter={(value: number) => [
                isRevenue ? formatMoney(Math.round(value * 100), { currency }) : `${value} ${t('orders')}`,
                isRevenue ? t('revenue') : t('orders'),
              ]}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#salesFill)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
