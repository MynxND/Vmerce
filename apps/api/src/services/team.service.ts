import { UserRole } from '@cc/types';
import type { TeamMemberDto } from '@cc/types';
import type { InviteMemberInput, UpdateMemberInput } from '@cc/shared';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { teamRepository } from '../repositories/team.repository';
import { userRepository } from '../repositories/user.repository';
import { toTeamMemberDto } from '../mappers/team.mapper';
import { ApiError } from '../utils/errors';
import { hashPassword, randomOpaqueToken } from '../utils/crypto';

export const teamService = {
  async list(storeId: string): Promise<TeamMemberDto[]> {
    const members = await teamRepository.list(storeId);
    return members.map(toTeamMemberDto);
  },

  /**
   * Invites a teammate by email.
   *
   * If the address already has an account it is linked immediately. Otherwise a
   * shell user is created with an unguessable random password and no
   * `onboardedAt`, so the invitee must go through password reset to get in —
   * an invite never yields a usable credential on its own.
   */
  async invite(storeId: string, actorId: string, input: InviteMemberInput): Promise<TeamMemberDto> {
    let user = await userRepository.findByEmail(input.email);

    if (user) {
      const existing = await teamRepository.findByUser(storeId, user.id);
      if (existing) throw ApiError.conflict('That person is already on your team');
    } else {
      user = await userRepository.create({
        email: input.email,
        passwordHash: await hashPassword(randomOpaqueToken(32)),
        role: UserRole.STAFF,
      });
    }

    const member = await teamRepository.create({
      storeId,
      userId: user.id,
      role: input.role,
      extraPermissions: input.extraPermissions,
      invitedEmail: input.email,
      // Existing accounts are live straight away; new ones accept via reset.
      acceptedAt: user.passwordHash && user.onboardedAt ? new Date() : null,
    });

    logger.info(
      `Team invite for ${input.email} on store ${storeId} by ${actorId}. Ask them to set a password at ${env.WEB_URL}/forgot-password`,
    );

    return toTeamMemberDto(member);
  },

  async update(
    storeId: string,
    actorId: string,
    memberId: string,
    input: UpdateMemberInput,
  ): Promise<TeamMemberDto> {
    const member = await teamRepository.findById(storeId, memberId);
    if (!member) throw ApiError.notFound('Team member not found');

    if (member.role === UserRole.STORE_OWNER) {
      throw ApiError.forbidden('The store owner’s role cannot be changed here');
    }
    if (member.userId === actorId) {
      throw ApiError.forbidden('You cannot change your own permissions');
    }

    const updated = await teamRepository.update(memberId, {
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.extraPermissions !== undefined ? { extraPermissions: input.extraPermissions } : {}),
    });

    return toTeamMemberDto(updated);
  },

  async remove(storeId: string, actorId: string, memberId: string): Promise<void> {
    const member = await teamRepository.findById(storeId, memberId);
    if (!member) throw ApiError.notFound('Team member not found');

    if (member.userId === actorId) {
      throw ApiError.forbidden('You cannot remove yourself from a store');
    }
    if (member.role === UserRole.STORE_OWNER) {
      const owners = await teamRepository.countOwners(storeId);
      // Never leave a store without an owner.
      if (owners <= 1) throw ApiError.forbidden('A store must keep at least one owner');
    }

    await teamRepository.delete(memberId);
  },
};
