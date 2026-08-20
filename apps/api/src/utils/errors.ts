/** Error codes surfaced to clients. Keep these stable — the web app matches on them. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'STORE_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'VARIANT_NOT_FOUND'
  | 'COLLECTION_NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'CART_NOT_FOUND'
  | 'CUSTOMER_NOT_FOUND'
  | 'CONFLICT'
  | 'EMAIL_TAKEN'
  | 'HANDLE_TAKEN'
  | 'SLUG_TAKEN'
  | 'OUT_OF_STOCK'
  | 'CART_EMPTY'
  | 'DISCOUNT_INVALID'
  | 'PAYMENT_FAILED'
  | 'UNSUPPORTED_PROVIDER'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  readonly details?: ApiErrorDetail[];
  /** `false` for programmer errors we do not want to leak to clients. */
  readonly isOperational = true;

  constructor(statusCode: number, code: ApiErrorCode, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    if (details) this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(
    message: string,
    code: ApiErrorCode = 'VALIDATION_ERROR',
    details?: ApiErrorDetail[],
  ) {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(message = 'Authentication required', code: ApiErrorCode = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }

  static forbidden(
    message = 'You do not have access to this resource',
    code: ApiErrorCode = 'FORBIDDEN',
  ) {
    return new ApiError(403, code, message);
  }

  static notFound(message = 'Resource not found', code: ApiErrorCode = 'NOT_FOUND') {
    return new ApiError(404, code, message);
  }

  static conflict(message: string, code: ApiErrorCode = 'CONFLICT') {
    return new ApiError(409, code, message);
  }

  static unprocessable(
    message: string,
    code: ApiErrorCode = 'VALIDATION_ERROR',
    details?: ApiErrorDetail[],
  ) {
    return new ApiError(422, code, message, details);
  }

  static internal(message = 'Something went wrong') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }
}
