import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Github, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = { title: 'Help' };

const TOPICS = [
  {
    icon: BookOpen,
    title: 'Setting up products with many variants',
    body: 'Add up to four options, tag values with a group label, then generate the variant matrix. Each variant carries its own SKU, price and stock.',
    href: '/dashboard/products/new',
    cta: 'Open the product editor',
  },
  {
    icon: MessageCircle,
    title: 'Publishing your storefront',
    body: 'Your shop is live at /@your-handle as soon as its status is Active and you have at least one active product.',
    href: '/dashboard/store',
    cta: 'Store settings',
  },
  {
    icon: Github,
    title: 'Where the phases are going',
    body: 'Phase 1 is catalogue, cart, checkout and orders. Phase 2 adds the section editor, discounts and team management. Phase 3 brings fulfillment providers and payments.',
    href: '/dashboard/integrations',
    cta: 'See the roadmap',
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Help" description="Short answers to the things people ask first." />

      <div className="grid gap-4 md:grid-cols-3">
        {TOPICS.map((topic) => (
          <Card key={topic.title}>
            <CardHeader>
              <span className="text-primary mb-1 flex size-9 items-center justify-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]">
                <topic.icon className="size-4" />
              </span>
              <CardTitle className="text-sm">{topic.title}</CardTitle>
              <CardDescription>{topic.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={topic.href} className="text-primary text-sm font-medium hover:underline">
                {topic.cta} →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
