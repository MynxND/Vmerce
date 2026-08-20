import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 does not await async handlers, so a rejected promise would become an
 * unhandled rejection instead of hitting the error middleware.
 */
export function asyncHandler<T extends Request = Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req as unknown as T, res, next).catch(next);
  };
}
