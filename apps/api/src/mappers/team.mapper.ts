import { UserRole, type StorePermission, type TeamMemberDto } from '@cc/types';
import { permissionsForRole } from '@cc/shared';
import type { TeamMemberRow } from '../repositories/team.repository';

export function toTeamMemberDto(member: TeamMemberRow): TeamMemberDto {
  const role = member.role as UserRole;
  const extraPermissions = member.extraPermissions as StorePermission[];

  // Same union the tenant guard computes, so the UI shows what is really enforced.
  const effective = new Set<StorePermission>([...permissionsForRole(role), ...extraPermissions]);

  return {
    id: member.id,
    storeId: member.storeId,
    userId: member.userId,
    email: member.user.email,
    name: member.user.name,
    avatarUrl: member.user.avatarUrl,
    role,
    extraPermissions,
    effectivePermissions: [...effective],
    isOwner: role === UserRole.STORE_OWNER,
    acceptedAt: member.acceptedAt?.toISOString() ?? null,
    invitedEmail: member.invitedEmail,
    createdAt: member.createdAt.toISOString(),
  };
}
