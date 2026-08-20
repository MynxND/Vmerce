import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration.
 *
 * The CLI only looks for a `.env` next to the schema or in the package root, but
 * this monorepo keeps one shared `.env` at the repo root. Loading it here means
 * `prisma migrate` / `prisma studio` see the same variables the running API does,
 * with no second copy to drift out of sync.
 */
const packageDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(packageDir, '../../.env') });
dotenv.config({ path: path.resolve(packageDir, '.env'), override: true });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
