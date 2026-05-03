import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { AUTH_COOKIE_NAME, getAuthCookieClearOptions, getAuthCookieOptions } from '../utils/authCookie';
import { loginUser, registerUser } from '../services/authService';
import { registerUserSchema } from '../validators/user.schema';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerUserSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const result = await registerUser(parsed.data);
    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
      throw new AppError('username and password are required', 400);
    }

    const result = await loginUser({ username, password });
    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieClearOptions());
  return res.status(204).end();
}
