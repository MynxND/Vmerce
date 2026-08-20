import type { Response } from 'express';
import type { ApiSuccess, Paginated, PaginationMeta } from '@cc/types';

export function success<T>(
  res: Response,
  data: T,
  message: string | null = null,
  status = 200,
): void {
  const body: ApiSuccess<T> = { success: true, data, message };
  res.status(status).json(body);
}

export function created<T>(res: Response, data: T, message: string | null = null): void {
  success(res, data, message, 201);
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function buildMeta(page: number, perPage: number, total: number): PaginationMeta {
  return {
    page,
    perPage,
    total,
    totalPages: perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1,
  };
}

export function paginated<T>(
  items: T[],
  page: number,
  perPage: number,
  total: number,
): Paginated<T> {
  return { items, meta: buildMeta(page, perPage, total) };
}
