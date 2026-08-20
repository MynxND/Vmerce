import type { MediaDto, Paginated } from '@cc/types';
import { mediaRepository } from '../repositories/media.repository';
import { toMediaDto } from '../mappers/media.mapper';
import { getStorageDriver } from '../modules/storage/index';
import { ApiError } from '../utils/errors';
import { paginated } from '../utils/response';

export const mediaService = {
  async list(storeId: string, page: number, perPage: number): Promise<Paginated<MediaDto>> {
    const { rows, total } = await mediaRepository.list({
      storeId,
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return paginated(rows.map(toMediaDto), page, perPage, total);
  },

  async upload(
    storeId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<MediaDto> {
    const driver = getStorageDriver();
    const stored = await driver.put({
      storeId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    const media = await mediaRepository.create({
      storeId,
      key: stored.key,
      url: stored.url,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      size: stored.size,
    });

    return toMediaDto(media);
  },

  async remove(storeId: string, mediaId: string): Promise<void> {
    const media = await mediaRepository.findById(storeId, mediaId);
    if (!media) throw ApiError.notFound('Media not found');

    await mediaRepository.delete(mediaId);
    // Best-effort: the DB row is the source of truth, orphaned blobs are swept later.
    await getStorageDriver().remove(media.key);
  },
};
