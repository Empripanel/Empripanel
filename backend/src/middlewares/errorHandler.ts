import { NextFunction, Request, Response } from 'express';
import { isAppError } from '../utils/errors';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);

  const status = isAppError(err) ? err.statusCode : 500;
  const message =
    err instanceof Error ? err.message : 'Internal server error';

  res.status(status).json({ success: false, message });
}

