import type { ApiResponse } from '@cc/types';
import { ApiClientError } from '@/lib/api-error';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export interface ServerFetchOptions {
  /** Seconds; `0` opts out of the data cache (default for commerce data). */
  revalidate?: number;
  tags?: string[];
  headers?: Record<string, string>;
}

/**
 * Server Component data loader for the public storefront API.
 *
 * Storefront pages are Server Components, so they talk to the API directly
 * rather than going through the browser client — no tokens, no client bundle.
 */
export async function serverFetch<T>(path: string, options: ServerFetchOptions = {}): Promise<T> {
  const { revalidate = 0, tags, headers } = options;

  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json', ...headers },
    next: revalidate > 0 ? { revalidate, ...(tags ? { tags } : {}) } : undefined,
    ...(revalidate > 0 ? {} : { cache: 'no-store' }),
  });

  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as ApiResponse<T>) : null;

  if (!response.ok || !parsed?.success) {
    throw new ApiClientError(
      response.status,
      parsed && parsed.success === false
        ? parsed.error
        : { code: 'INTERNAL_ERROR', message: 'Storefront data is unavailable right now.' },
    );
  }

  return parsed.data;
}

/** Returns `null` instead of throwing on 404 — for optional storefront data. */
export async function serverFetchOptional<T>(
  path: string,
  options?: ServerFetchOptions,
): Promise<T | null> {
  try {
    return await serverFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}
