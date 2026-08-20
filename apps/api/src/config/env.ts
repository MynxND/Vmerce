import { z } from 'zod';
import { loadEnvFiles } from './load-env';

loadEnvFiles();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  /** Direct (non-pooled) URL, used only by Prisma migrations. */
  DIRECT_URL: z.string().optional(),

  API_PORT: z.coerce.number().int().positive().default(4000),
  API_URL: z.string().url().default('http://localhost:4000'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  JWT_ACCESS_SECRET: z.string().min(24, 'JWT_ACCESS_SECRET must be at least 24 characters'),
  JWT_REFRESH_SECRET: z.string().min(24, 'JWT_REFRESH_SECRET must be at least 24 characters'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  PASSWORD_RESET_TOKEN_EXPIRES_IN: z.string().default('1h'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  STORAGE_DRIVER: z.enum(['local', 's3', 'r2', 'supabase']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('uploads'),
  STORAGE_PUBLIC_URL: z.string().url().default('http://localhost:4000/uploads'),

  PAYMENT_PROVIDER: z.string().default('manual'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
  );
  // Fail fast: a half-configured API is worse than one that refuses to boot.
  console.error(`\nInvalid environment configuration:\n${issues.join('\n')}\n`);
  console.error('Copy .env.example to .env at the repo root and fill in the values.\n');
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;

export type Env = typeof env;
