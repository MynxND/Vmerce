import type { Metadata, Viewport } from 'next';
import { clientEnv } from '@/lib/env';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${clientEnv.platformName} — merch stores for creators`,
    template: `%s · ${clientEnv.platformName}`,
  },
  description:
    'Open a shop, upload your artwork, and start selling merch in an afternoon. Built for VTubers, streamers, illustrators, musicians and small studios.',
  metadataBase: new URL(clientEnv.appUrl),
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbfd' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0c14' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
