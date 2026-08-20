import type { Prisma, StoreMember, User } from '@prisma/client';
import { prisma } from '../config/prisma';

export type TeamMemberRow = StoreMember & { user: User };

export const teamRepository = {
  list(storeId: string): Promise<TeamMemberRow[]> {
    return prisma.storeMember.findMany({
      where: { storeId },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  },

  findById(storeId: string, memberId: string): Promise<TeamMemberRow | null> {
    return prisma.storeMember.findFirst({
      where: { id: memberId, storeId },
      include: { user: true },
    });
  },

  findByUser(storeId: string, userId: string): Promise<TeamMemberRow | null> {
    return prisma.storeMember.findUnique({
      where: { storeId_userId: { storeId, userId } },
      include: { user: true },
    });
  },

  create(data: Prisma.StoreMemberUncheckedCreateInput): Promise<TeamMemberRow> {
    return prisma.storeMember.create({ data, include: { user: true } });
  },

  update(memberId: string, data: Prisma.StoreMemberUpdateInput): Promise<TeamMemberRow> {
    return prisma.storeMember.update({
      where: { id: memberId },
      data,
      include: { user: true },
    });
  },

  delete(memberId: string): Promise<{ id: string }> {
    return prisma.storeMember.delete({ where: { id: memberId }, select: { id: true } });
  },

  countOwners(storeId: string): Promise<number> {
    return prisma.storeMember.count({ where: { storeId, role: 'STORE_OWNER' } });
  },
};
