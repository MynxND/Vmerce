import { env } from '../../config/env';
import { ApiError } from '../../utils/errors';
import { localStorageDriver } from './local.driver';
import type { StorageDriver } from './types';

const drivers: Record<string, StorageDriver> = {
  local: localStorageDriver,
};

export function getStorageDriver(): StorageDriver {
  const driver = drivers[env.STORAGE_DRIVER];
  if (!driver) {
    throw ApiError.internal(
      `Storage driver "${env.STORAGE_DRIVER}" is not implemented yet. Use STORAGE_DRIVER=local.`,
    );
  }
  return driver;
}

export type { StorageDriver, StoredFile } from './types';
