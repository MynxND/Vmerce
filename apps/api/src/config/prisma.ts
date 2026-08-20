import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * A single Prisma client per process. `globalThis` caching keeps `tsx watch`
 * from opening a new connection pool on every reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDevelopment ? ['warn', 'error'] : ['error'],
  });

if (env.isDevelopment) globalForPrisma.prisma = prisma;

export type { Prisma } from '@prisma/client';
