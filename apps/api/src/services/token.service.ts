import jwt from 'jsonwebtoken';
import type { UserRole } from '@cc/types';
import { env } from '../config/env';
import { ApiError } from '../utils/errors';
import { parseDuration } from '../utils/duration';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'creator-commerce',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'creator-commerce' });
    if (typeof decoded === 'string') throw new Error('Unexpected token payload');
    return decoded as AccessTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Access token expired', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Access token is invalid', 'TOKEN_INVALID');
  }
}

export const accessTokenTtlMs = parseDuration(env.ACCESS_TOKEN_EXPIRES_IN);
export const refreshTokenTtlMs = parseDuration(env.REFRESH_TOKEN_EXPIRES_IN);
export const passwordResetTtlMs = parseDuration(env.PASSWORD_RESET_TOKEN_EXPIRES_IN);
