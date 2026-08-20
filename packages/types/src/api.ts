/** Standard success/error envelopes returned by every `/api/v1` endpoint. */

export interface ApiSuccess<TData> {
  success: true;
  data: TData;
  message: string | null;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  /** Field-level validation issues, present for `VALIDATION_ERROR`. */
  details?: Array<{ path: string; message: string }>;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface Paginated<TItem> {
  items: TItem[];
  meta: PaginationMeta;
}
