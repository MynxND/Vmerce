import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  phase: 'Phase 2' | 'Phase 3';
  description: string;
  bullets: string[];
}

/**
 * Placeholder for surfaces that are scheduled but deliberately not built yet.
 * Being explicit about the phase beats a dead link or a half-working screen.
 */
export function ComingSoon({ icon: Icon, title, phase, description, bullets }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={phase} title={title} description={description} />

      <Card>
        <CardContent className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
          <span className="text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Planned for {phase.toLowerCase()}</p>
            <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span aria-hidden className="text-primary">
                    ·
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
