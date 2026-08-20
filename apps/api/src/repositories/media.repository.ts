import type { Media, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export const mediaRepository = {
  create(data: Prisma.MediaUncheckedCreateInput): Promise<Media> {
    return prisma.media.create({ data });
  },

  findById(storeId: string, mediaId: string): Promise<Media | null> {
    return prisma.media.findFirst({ where: { id: mediaId, storeId } });
  },

  async list(params: { storeId: string; skip: number; take: number }) {
    const where: Prisma.MediaWhereInput = { storeId: params.storeId };
    const [rows, total] = await prisma.$transaction([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.media.count({ where }),
    ]);
    return { rows, total };
  },

  delete(mediaId: string): Promise<{ id: string; key: string }> {
    return prisma.media.delete({ where: { id: mediaId }, select: { id: true, key: true } });
  },
};
