import { NextFunction, Request, Response } from 'express';

const DEFAULT_FORBIDDEN_MESSAGE = 'Access denied.';

export type AuthorizeRoleOptions = {
  forbiddenMessage?: string;
};

/**
 * Must run AFTER authenticate middleware.
 * Returns 401 if no user, 403 if role does not match, otherwise continues.
 * requiredRole can be a single role or an array of roles (user must have one of them).
 */
export function authorizeRole(
  requiredRole: string | string[],
  options: AuthorizeRoleOptions = {}
) {
  const forbiddenMessage =
    options.forbiddenMessage ?? DEFAULT_FORBIDDEN_MESSAGE;
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  return function (req: Request, res: Response, next: NextFunction) {
    if (!req.auth) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({
        success: false,
        message: forbiddenMessage,
      });
    }

    next();
  };
}
