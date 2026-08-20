import { StorePermission, UserRole } from '@cc/types';

/**
 * Role → permission matrix for store-scoped access.
 *
 * `SUPER_ADMIN` is a platform role and is handled separately (it bypasses the
 * store membership check entirely). The remaining roles are the roles a user can
 * hold *within a single store* via `StoreMember`.
 */
const ALL_PERMISSIONS = Object.values(StorePermission);

export const ROLE_PERMISSIONS: Record<UserRole, StorePermission[]> = {
  [UserRole.SUPER_ADMIN]: ALL_PERMISSIONS,
  [UserRole.STORE_OWNER]: ALL_PERMISSIONS,
  [UserRole.STORE_ADMIN]: ALL_PERMISSIONS.filter(
    (permission) => permission !== StorePermission.TEAM_MANAGE,
  ),
  [UserRole.STAFF]: [
    StorePermission.STORE_VIEW,
    StorePermission.PRODUCT_VIEW,
    StorePermission.PRODUCT_CREATE,
    StorePermission.PRODUCT_EDIT,
    StorePermission.ORDER_VIEW,
    StorePermission.ORDER_UPDATE,
    StorePermission.CUSTOMER_VIEW,
  ],
  [UserRole.CUSTOMER]: [],
};

export function permissionsForRole(role: UserRole): StorePermission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: UserRole, permission: StorePermission): boolean {
  return permissionsForRole(role).includes(permission);
}

export function hasAllPermissions(
  granted: readonly StorePermission[],
  required: readonly StorePermission[],
): boolean {
  return required.every((permission) => granted.includes(permission));
}
