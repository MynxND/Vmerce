import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { PutFileInput, StorageDriver, StoredFile } from './types';

const ROOT = path.resolve(process.cwd(), env.STORAGE_LOCAL_DIR);

function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : '';
}

/** Development driver: writes under `apps/api/uploads`, served by Express. */
export const localStorageDriver: StorageDriver = {
  name: 'local',

  async put(input: PutFileInput): Promise<StoredFile> {
    // Store-scoped prefix keeps tenants' files in separate directories.
    const key = `${input.storeId}/${randomUUID()}${safeExtension(input.fileName)}`;
    const target = path.join(ROOT, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.buffer);

    return {
      key,
      url: `${env.STORAGE_PUBLIC_URL}/${key}`,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.buffer.byteLength,
    };
  },

  async remove(key: string): Promise<void> {
    try {
      await unlink(path.join(ROOT, key));
    } catch (error) {
      // Missing file on delete is not worth failing the request over.
      logger.warn(`Could not remove local file ${key}`, error);
    }
  },
};
