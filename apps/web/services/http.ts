import type { ApiErrorBody, ApiResponse } from '@cc/types';
import { clientEnv } from '@/lib/env';
import { ApiClientError } from '@/lib/api-error';
import { getAccessToken, notifySessionExpired, setAccessToken } from './session-token';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip the bearer header (public storefront endpoints). */
  anonymous?: boolean;
  /** Internal: prevents an infinite refresh loop. */
  _retried?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${clientEnv.apiUrl}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function parseBody<T>(response: Response): Promise<ApiResponse<T> | null> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return null;
  }
}

const GENERIC_ERROR: ApiErrorBody = {
  code: 'INTERNAL_ERROR',
  message: 'The server returned an unexpected response.',
};

/**
 * Exchanges the httpOnly refresh cookie for a new access token. Concurrent 401s
 * share a single in-flight refresh so a page with six queries only refreshes once.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!response.ok) return false;
      const body = await parseBody<{ tokens: { accessToken: string } }>(response);
      if (!body?.success) return false;
      setAccessToken(body.data.tokens.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      // Allow the next 401 to trigger a fresh attempt.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();

  return refreshInFlight;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, anonymous, query, _retried, headers, ...rest } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const token = anonymous ? null : getAccessToken();

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: isFormData ? (body as FormData) : JSON.stringify(body) }),
  });

  if (response.status === 401 && !anonymous && !_retried) {
    if (await refreshAccessToken()) {
      return request<T>(path, { ...options, _retried: true });
    }
    notifySessionExpired();
  }

  const parsed = await parseBody<T>(response);

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      parsed?.success === false ? parsed.error : GENERIC_ERROR,
    );
  }

  // 204 responses have no body but are still successful.
  if (parsed === null) return undefined as T;
  if (parsed.success === false) throw new ApiClientError(response.status, parsed.error);

  return parsed.data;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
