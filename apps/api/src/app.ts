import path from 'node:path';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { API_PREFIX } from './config/constants';
import { env } from './config/env';
import { apiRoutes } from './routes/index';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { globalRateLimit } from './middlewares/rate-limit';
import { success } from './utils/response';

export function createApp(): Express {
  const app = express();

  // Behind a proxy in production so `req.ip` and rate limiting see real clients.
  app.set('trust proxy', env.isProduction ? 1 : false);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Uploaded images are served from this origin and embedded by the web app.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: env.isProduction ? undefined : false,
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin/server-side requests arrive without an Origin header.
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      exposedHeaders: ['X-Cart-Token'],
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  if (!env.isProduction) app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    success(res, { status: 'ok', uptime: Math.round(process.uptime()) });
  });

  // Local storage driver: serve uploaded media.
  if (env.STORAGE_DRIVER === 'local') {
    app.use(
      '/uploads',
      express.static(path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR), {
        maxAge: env.isProduction ? '30d' : 0,
        index: false,
        dotfiles: 'deny',
      }),
    );
  }

  app.use(API_PREFIX, globalRateLimit, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
