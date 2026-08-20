import type { ApiErrorBody } from '@cc/types';

/** Thrown by the fetch wrapper for any non-2xx response. */
export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorBody['details'];

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }

  /** Maps field-level issues onto react-hook-form paths. */
  fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    this.details?.forEach((issue) => {
      if (issue.path) result[issue.path] = issue.message;
    });
    return result;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
