import { existsSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

let loaded = false;

/**
 * Walks up from the working directory collecting every `.env` it finds, then
 * loads them root-first so an app-local file overrides the shared one.
 *
 * Resolving from `process.cwd()` rather than `import.meta.url` keeps this working
 * identically under `tsx src/server.ts`, the bundled `dist/server.js`, and a
 * standalone `tsx prisma/seed.ts`.
 */
export function loadEnvFiles(): void {
  if (loaded) return;
  loaded = true;

  const found: string[] = [];
  let dir = process.cwd();

  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = path.join(dir, '.env');
    if (existsSync(candidate)) found.push(candidate);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // `found` is nearest-first; reverse so the nearest file wins.
  found.reverse().forEach((file, index) => {
    dotenv.config({ path: file, override: index > 0 });
  });
}
