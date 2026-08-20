import type { Media } from '@prisma/client';
import type { MediaDto } from '@cc/types';

export function toMediaDto(media: Media): MediaDto {
  return {
    id: media.id,
    storeId: media.storeId,
    url: media.url,
    fileName: media.fileName,
    mimeType: media.mimeType,
    size: media.size,
    width: media.width,
    height: media.height,
    alt: media.alt,
    createdAt: media.createdAt.toISOString(),
  };
}
