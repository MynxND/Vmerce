import { UserRole } from '@cc/types';
import type { AuthSessionDto, AuthTokensDto, UserDto } from '@cc/types';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@cc/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { userRepository } from '../repositories/user.repository';
import { tokenRepository } from '../repositories/token.repository';
import { toUserDto } from '../mappers/user.mapper';
import { ApiError } from '../utils/errors';
import { hashPassword, randomOpaqueToken, sha256, verifyPassword } from '../utils/crypto';
import {
  accessTokenTtlMs,
  passwordResetTtlMs,
  refreshTokenTtlMs,
  signAccessToken,
} from './token.service';
import { listAccessibleStores } from './store-access.service';

export interface RequestFingerprint {
  userAgent?: string | null;
  ip?: string | null;
}

async function issueTokens(
  user: { id: string; email: string; role: string },
  fingerprint: RequestFingerprint,
): Promise<AuthTokensDto> {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role as UserRole,
  });

  const refreshToken = randomOpaqueToken();
  await tokenRepository.createRefreshToken({
    userId: user.id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + refreshTokenTtlMs),
    userAgent: fingerprint.userAgent ?? null,
    ip: fingerprint.ip ?? null,
  });

  return { accessToken, refreshToken, expiresIn: Math.floor(accessTokenTtlMs / 1000) };
}

async function buildSession(
  user: { id: string; email: string; role: string },
  dto: UserDto,
  fingerprint: RequestFingerprint,
): Promise<AuthSessionDto> {
  const [tokens, stores] = await Promise.all([
    issueTokens(user, fingerprint),
    listAccessibleStores(user.id),
  ]);
  return { user: dto, tokens, stores };
}

export const authService = {
  async register(input: RegisterInput, fingerprint: RequestFingerprint): Promise<AuthSessionDto> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw ApiError.conflict('That email is already registered', 'EMAIL_TAKEN');

    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      role: UserRole.STORE_OWNER,
    });

    return buildSession(user, toUserDto(user), fingerprint);
  },

  async login(input: LoginInput, fingerprint: RequestFingerprint): Promise<AuthSessionDto> {
    const user = await userRepository.findByEmail(input.email);

    // Same error for "no such user" and "wrong password" so the endpoint cannot
    // be used to discover which emails have accounts.
    const invalid = ApiError.unauthorized('Email or password is incorrect', 'INVALID_CREDENTIALS');
    if (!user?.passwordHash) throw invalid;
    if (!(await verifyPassword(user.passwordHash, input.password))) throw invalid;

    await userRepository.markLogin(user.id);
    return buildSession(user, toUserDto(user), fingerprint);
  },

  /** Refresh-token rotation: the presented token is revoked as it is exchanged. */
  async refresh(rawToken: string, fingerprint: RequestFingerprint): Promise<AuthSessionDto> {
    const record = await tokenRepository.findRefreshToken(sha256(rawToken));
    if (!record || record.revokedAt || record.expiresAt.getTime() < Date.now()) {
      throw ApiError.unauthorized('Refresh token is invalid or expired', 'TOKEN_INVALID');
    }

    const user = await userRepository.findById(record.userId);
    if (!user) throw ApiError.unauthorized('Refresh token is invalid', 'TOKEN_INVALID');

    await tokenRepository.revokeRefreshToken(record.id);
    return buildSession(user, toUserDto(user), fingerprint);
  },

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const record = await tokenRepository.findRefreshToken(sha256(rawToken));
    if (record && !record.revokedAt) await tokenRepository.revokeRefreshToken(record.id);
  },

  async logoutAll(userId: string): Promise<void> {
    await tokenRepository.revokeAllForUser(userId);
  },

  async me(userId: string): Promise<AuthSessionDto['user'] & { stores: AuthSessionDto['stores'] }> {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.unauthorized();
    const stores = await listAccessibleStores(user.id);
    return { ...toUserDto(user), stores };
  },

  /**
   * Always resolves, whether or not the email exists. In Phase 1 the reset link
   * is logged instead of emailed — swapping in a mailer is the only change.
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) return;

    const rawToken = randomOpaqueToken(32);
    await tokenRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash: sha256(rawToken),
      expiresAt: new Date(Date.now() + passwordResetTtlMs),
    });

    logger.info(
      `Password reset requested for ${user.email}: ${env.WEB_URL}/reset-password?token=${rawToken}`,
    );
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const record = await tokenRepository.findPasswordResetToken(sha256(input.token));
    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw ApiError.badRequest('This reset link is invalid or has expired', 'TOKEN_INVALID');
    }

    await userRepository.update(record.userId, {
      passwordHash: await hashPassword(input.password),
    });
    await tokenRepository.consumePasswordResetToken(record.id);
    // A password change invalidates every existing session.
    await tokenRepository.revokeAllForUser(record.userId);
  },
};
