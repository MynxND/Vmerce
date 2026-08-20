/** Public runtime configuration. Only `NEXT_PUBLIC_*` values belong here. */
export const clientEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  platformName: process.env.NEXT_PUBLIC_PLATFORM_NAME ?? 'Storefront Studio',
} as const;
