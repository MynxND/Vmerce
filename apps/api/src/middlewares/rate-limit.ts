import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../config/env';

const shared: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  // Mirror the platform error envelope so clients only parse one shape.
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
    });
  },
};

export const globalRateLimit = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

/** Tighter budget for credential endpoints. */
export const authRateLimit = rateLimit({
  ...shared,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: false,
});
