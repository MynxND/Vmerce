import type { Metadata } from 'next';
import { DashboardOverview } from '@/features/analytics/dashboard-overview';

export const metadata: Metadata = { title: 'Analytics' };

/**
 * Phase 1 analytics are the same aggregates the overview shows. Deeper reporting
 * (sales by collection, cohort views, real visitor tracking) lands in Phase 2.
 */
export default function AnalyticsPage() {
  return <DashboardOverview />;
}
