import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { ZodError } from 'zod';
import { ApiError } from '../utils/errors';

type Source = 'body' | 'query' | 'params';

function run<S extends ZodTypeAny>(schema: S, source: Source): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Replace the raw input with the parsed value so controllers only ever see
      // coerced, defaulted, trimmed data.
      const parsed = schema.parse(req[source]);
      Object.defineProperty(req, source, { value: parsed, writable: true, configurable: true });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          ApiError.unprocessable(
            'Validation failed',
            'VALIDATION_ERROR',
            error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
          ),
        );
        return;
      }
      next(error);
    }
  };
}

export const validateBody = <S extends ZodTypeAny>(schema: S) => run(schema, 'body');
export const validateQuery = <S extends ZodTypeAny>(schema: S) => run(schema, 'query');
export const validateParams = <S extends ZodTypeAny>(schema: S) => run(schema, 'params');

/** Convenience type helper for controllers: `Body<typeof loginSchema>`. */
export type Body<S extends ZodTypeAny> = z.infer<S>;
