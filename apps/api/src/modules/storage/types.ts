export interface StoredFile {
  key: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface PutFileInput {
  storeId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

/**
 * Binary storage abstraction. Images are never written into PostgreSQL — only
 * the key and public URL are. Swapping `local` for S3 / R2 / Supabase Storage is
 * a driver change, not a schema change.
 */
export interface StorageDriver {
  readonly name: string;
  put(input: PutFileInput): Promise<StoredFile>;
  remove(key: string): Promise<void>;
}
