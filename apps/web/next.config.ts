import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const apiOrigin = new URL(apiUrl).origin;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The workspace packages ship raw TypeScript.
  transpilePackages: ['@cc/shared', '@cc/types'],
  experimental: {
    // `next dev` caches fetch responses across HMR refreshes, even for
    // `cache: 'no-store'`. For order and payment state that shows stale data
    // after a mutation, which is actively misleading while building checkout.
    serverComponentsHmrCache: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      {
        protocol: new URL(apiOrigin).protocol.replace(':', '') as 'http' | 'https',
        hostname: new URL(apiOrigin).hostname,
      },
    ],
  },
};

export default nextConfig;
