import type { User } from '@prisma/client';
import type { UserDto, UserRole } from '@cc/types';

/** Never spread a Prisma row straight onto the wire — `passwordHash` lives there. */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role as UserRole,
    onboardedAt: user.onboardedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
