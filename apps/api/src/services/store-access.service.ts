import { StorePermission, UserRole } from '@cc/types';
import { permissionsForRole } from '@cc/shared';
import type { StoreContext } from '../types/express';
import { storeRepository } from '../repositories/store.repository';
import { ApiError } from '../utils/errors';

/**
 * The single place where "can this user touch this store?" is answered.
 *
 * Returns a 404 rather than a 403 when the user has no membership, so probing
 * store ids cannot be used to enumerate other tenants.
 */
export async function resolveStoreAccess(
  userId: string,
  platformRole: UserRole,
  storeId: string,
): Promise<StoreContext> {
  const store = await storeRepository.findById(storeId);
  if (!store) throw ApiError.notFound('Store not found', 'STORE_NOT_FOUND');

  if (platformRole === UserRole.SUPER_ADMIN) {
    return {
      storeId: store.id,
      handle: store.handle,
      role: UserRole.SUPER_ADMIN,
      permissions: Object.values(StorePermission),
    };
  }

  const membership = await storeRepository.findMembership(userId, storeId);
  if (!membership) throw ApiError.notFound('Store not found', 'STORE_NOT_FOUND');

  const role = membership.role as UserRole;
  const permissions = new Set<StorePermission>([
    ...permissionsForRole(role),
    ...(membership.extraPermissions as StorePermission[]),
  ]);

  return {
    storeId: store.id,
    handle: store.handle,
    role,
    permissions: [...permissions],
  };
}

/** Store list for the authenticated user, used by `/me` and the store switcher. */
export async function listAccessibleStores(userId: string) {
  const memberships = await storeRepository.listForUser(userId);
  return memberships.map((membership) => {
    const role = membership.role as UserRole;
    const permissions = new Set<StorePermission>([
      ...permissionsForRole(role),
      ...(membership.extraPermissions as StorePermission[]),
    ]);
    return {
      id: membership.store.id,
      name: membership.store.name,
      handle: membership.store.handle,
      logoUrl: membership.store.logoUrl,
      status: membership.store.status,
      permissions: [...permissions],
    };
  });
}
