import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from '@cc/shared';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';
import { authRateLimit } from '../middlewares/rate-limit';
import { validateBody } from '../middlewares/validate';
import { asyncHandler } from '../utils/async-handler';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  authRateLimit,
  validateBody(registerSchema),
  asyncHandler(authController.register),
);
authRoutes.post(
  '/login',
  authRateLimit,
  validateBody(loginSchema),
  asyncHandler(authController.login),
);
authRoutes.post('/refresh', validateBody(refreshSchema), asyncHandler(authController.refresh));
authRoutes.post('/logout', asyncHandler(authController.logout));
authRoutes.post('/logout-all', requireAuth, asyncHandler(authController.logoutAll));
authRoutes.post(
  '/forgot-password',
  authRateLimit,
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
authRoutes.post(
  '/reset-password',
  authRateLimit,
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
