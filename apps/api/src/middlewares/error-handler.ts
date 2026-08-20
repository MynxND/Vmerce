import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import type { ApiFailure } from '@cc/types';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError, type ApiErrorDetail } from '../utils/errors';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
};

function zodDetails(error: ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Single exit point for every error. Nothing internal (stack traces, Prisma
 * messages, SQL) is ever written to the response body.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    apiError = ApiError.unprocessable('Validation failed', 'VALIDATION_ERROR', zodDetails(error));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    apiError = mapPrismaError(error);
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    apiError = ApiError.badRequest('Invalid request payload');
  } else if (isPayloadTooLarge(error)) {
    apiError = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Uploaded file is too large');
  } else {
    apiError = ApiError.internal();
  }

  if (apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${apiError.statusCode}`, {
      message: error instanceof Error ? error.message : String(error),
      stack: env.isProduction ? undefined : (error as Error)?.stack,
    });
  } else {
    logger.debug(`${req.method} ${req.originalUrl} -> ${apiError.statusCode} ${apiError.code}`);
  }

  const body: ApiFailure = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  };

  res.status(apiError.statusCode).json(body);
};

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): ApiError {
  switch (error.code) {
    case 'P2002': {
      const target = (error.meta?.target as string[] | string | undefined) ?? [];
      const fields = Array.isArray(target) ? target.join(', ') : String(target);
      return ApiError.conflict(
        fields ? `A record with that ${fields} already exists` : 'That record already exists',
      );
    }
    case 'P2003':
      return ApiError.badRequest('Related record does not exist');
    case 'P2025':
      return ApiError.notFound('Resource not found');
    default:
      return ApiError.internal();
  }
}

function isPayloadTooLarge(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'LIMIT_FILE_SIZE'
  );
}
