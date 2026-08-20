import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';

async function main(): Promise<void> {
  // Fail fast on a bad DATABASE_URL rather than on the first request.
  await prisma.$connect();

  const app = createApp();
  const server = app.listen(env.API_PORT, () => {
    logger.info(`API listening on ${env.API_URL}`);
    logger.info(`REST base:   ${env.API_URL}/api/v1`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
    // Do not hang forever on a stuck connection.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error('Failed to start API', error);
  process.exit(1);
});
