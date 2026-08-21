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
          href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Barlow+Condensed&family=Bebas+Neue&family=Black+Ops+One&family=Cormorant+Garamond&family=DM+Sans&family=IBM+Plex+Mono&family=IBM+Plex+Sans+Thai&family=Inter&family=JetBrains+Mono&family=Kanit&family=M+PLUS+1p&family=Manrope:wght@400;500;600;700;800&family=Merriweather&family=Montserrat&family=Noto+Sans+JP:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&family=Orbitron&family=Oswald&family=Playfair+Display&family=Poppins&family=Press+Start+2P&family=Prompt&family=Roboto&family=Sarabun&family=Space+Grotesk&family=Space+Mono&family=Zen+Kaku+Gothic+New&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
