import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { clientEnv } from '@/lib/env';

const HIGHLIGHTS = [
  {
    title: 'Your shop, your look',
    body: 'Pick a starting style, then tune colours, type and layout until it feels like yours.',
  },
  {
    title: 'Built for merch',
    body: 'Phone cases with forty device variants, acrylic stands, prints, stickers — one product model handles all of it.',
  },
  {
    title: 'Ready to grow',
    body: 'Print-on-demand and payment providers plug in later without rewriting your catalogue.',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — hidden on small screens so the form gets full attention. */}
      <aside className="relative hidden overflow-hidden bg-[color-mix(in_oklab,var(--primary)_92%,black)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(900px 420px at 12% -10%, color-mix(in oklab, white 22%, transparent), transparent), radial-gradient(700px 420px at 110% 110%, color-mix(in oklab, #ff5c7a 40%, transparent), transparent)',
          }}
        />
        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="size-4" />
            </span>
            {clientEnv.platformName}
          </Link>
        </div>

        <div className="relative max-w-md space-y-8">
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight">
            Merch stores that look like they were made for you.
          </h2>
          <ul className="space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title}>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-white/70">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          Phase 1 build — catalogue, cart, checkout and orders.
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
