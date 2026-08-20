import type { RequestHandler } from 'express';
import { UserRole } from '@cc/types';
import { ApiError } from '../utils/errors';
import { verifyAccessToken } from '../services/token.service';

function readBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!token || scheme?.toLowerCase() !== 'bearer') return null;
  return token.trim() || null;
}

/** Rejects the request unless a valid access token is present. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = readBearer(req.headers.authorization);
  if (!token) {
    next(ApiError.unauthorized());
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
};

/** Attaches `req.auth` when a token is present but never fails the request. */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const token = readBearer(req.headers.authorization);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, email: payload.email, role: payload.role };
  } catch {
    // An expired token on a public endpoint should behave like an anonymous visit.
  }
  next();
};

/** Platform-level role gate (distinct from store-scoped permissions). */
export function requirePlatformRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}

export const requireSuperAdmin = requirePlatformRole(UserRole.SUPER_ADMIN);
