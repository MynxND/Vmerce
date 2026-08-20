import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  LayoutTemplate,
  Palette,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clientEnv } from '@/lib/env';

const FEATURES = [
  {
    icon: Palette,
    title: 'A storefront that looks like you',
    body: 'Ten starting styles, then full control over colour, type, layout and corner radius — driven by CSS variables, not a thousand generated classes.',
  },
  {
    icon: Boxes,
    title: 'Variants that survive real merch',
    body: 'Phone models, colours and case types combine into a generated variant matrix. Each row gets its own SKU, price and stock.',
  },
  {
    icon: ShoppingBag,
    title: 'Cart and checkout included',
    body: 'Anonymous carts, discount codes, shipping options and immutable order snapshots so editing a product never rewrites history.',
  },
  {
    icon: Truck,
    title: 'Fulfillment kept at arm’s length',
    body: 'Print-on-demand and dropshipping sit behind one adapter interface, so nothing in your catalogue is tied to a single supplier.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display flex items-center gap-2 text-base font-bold tracking-tight">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-xl">
            <Sparkles className="size-4" />
          </span>
          {clientEnv.platformName}
        </span>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Open a shop</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-20">
          <p className="border-border bg-card text-muted-foreground mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-[color-mix(in_oklab,var(--success)_70%,var(--foreground))]" />
            Phase 1: catalogue, cart, checkout and orders
          </p>
          <h1 className="font-display max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Merch stores for people who make things.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg">
            Built for VTubers, streamers, illustrators, writers, musicians and small studios. Open a
            shop, upload your artwork, and start selling — without a storefront that looks like
            everyone else’s.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">
                Open your shop <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/@neko">
                <LayoutTemplate /> See a demo store
              </Link>
            </Button>
          </div>
        </section>

        <section className="border-border bg-card/60 border-y">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <span className="text-primary flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]">
                  <feature.icon className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">{feature.title}</h2>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    {feature.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Your shop lives at a URL you can say out loud.
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md font-mono text-sm">
            {clientEnv.appUrl.replace(/^https?:\/\//, '')}/@yourname
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link href="/register">
              Get started <ArrowRight />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-border border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs">
          <span>{clientEnv.platformName} — a creator-commerce platform reference build.</span>
          <span className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/@neko" className="hover:text-foreground">
              Demo store
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
