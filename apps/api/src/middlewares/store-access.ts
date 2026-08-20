import type { RequestHandler } from 'express';
import { UserRole } from '@cc/types';
import type { StorePermission } from '@cc/types';
import { hasAllPermissions } from '@cc/shared';
import { ApiError } from '../utils/errors';
import { resolveStoreAccess } from '../services/store-access.service';

/**
 * Tenant guard. Resolves `:storeId` (path param) against the authenticated
 * user's store memberships and attaches the effective permission set.
 *
 * Every store-scoped route must sit behind this — the client-supplied storeId is
 * never trusted on its own.
 */
export function requireStoreAccess(...required: StorePermission[]): RequestHandler[] {
  const resolve: RequestHandler = async (req, _res, next) => {
    try {
      if (!req.auth) throw ApiError.unauthorized();

      const storeId = req.params.storeId;
      if (!storeId) throw ApiError.badRequest('storeId is required');

      const access = await resolveStoreAccess(req.auth.userId, req.auth.role, storeId);
      req.store = access;

      if (required.length > 0 && !hasAllPermissions(access.permissions, required)) {
        throw ApiError.forbidden(
          `Missing permission: ${required.filter((p) => !access.permissions.includes(p)).join(', ')}`,
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };

  return [resolve];
}

export function isPlatformAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}
