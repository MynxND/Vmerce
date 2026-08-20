import type { Request, Response } from 'express';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@cc/shared';
import { COOKIE_PATHS, REFRESH_TOKEN_COOKIE } from '../config/constants';
import { env } from '../config/env';
import { authService } from '../services/auth.service';
import { refreshTokenTtlMs } from '../services/token.service';
import { ApiError } from '../utils/errors';
import { created, noContent, success } from '../utils/response';

function fingerprint(req: Request) {
  return { userAgent: req.get('user-agent') ?? null, ip: req.ip ?? null };
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: COOKIE_PATHS.refresh,
    maxAge: refreshTokenTtlMs,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: COOKIE_PATHS.refresh });
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const session = await authService.register(req.body as RegisterInput, fingerprint(req));
    setRefreshCookie(res, session.tokens.refreshToken);
    created(res, session, 'Account created');
  },

  async login(req: Request, res: Response): Promise<void> {
    const session = await authService.login(req.body as LoginInput, fingerprint(req));
    setRefreshCookie(res, session.tokens.refreshToken);
    success(res, session, 'Signed in');
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const body = req.body as { refreshToken?: string };
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = body.refreshToken ?? cookies?.[REFRESH_TOKEN_COOKIE];
    if (!token) throw ApiError.unauthorized('No refresh token provided', 'TOKEN_INVALID');

    const session = await authService.refresh(token, fingerprint(req));
    setRefreshCookie(res, session.tokens.refreshToken);
    success(res, session);
  },

  async logout(req: Request, res: Response): Promise<void> {
    const body = req.body as { refreshToken?: string } | undefined;
    const cookies = req.cookies as Record<string, string> | undefined;
    await authService.logout(body?.refreshToken ?? cookies?.[REFRESH_TOKEN_COOKIE]);
    clearRefreshCookie(res);
    noContent(res);
  },

  async logoutAll(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw ApiError.unauthorized();
    await authService.logoutAll(req.auth.userId);
    clearRefreshCookie(res);
    noContent(res);
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.auth) throw ApiError.unauthorized();
    success(res, await authService.me(req.auth.userId));
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    await authService.forgotPassword(req.body as ForgotPasswordInput);
    // Always the same response, whether or not the address exists.
    success(res, { sent: true }, 'If that email is registered, a reset link is on its way.');
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body as ResetPasswordInput);
    success(res, { reset: true }, 'Password updated. Please sign in again.');
  },
};
