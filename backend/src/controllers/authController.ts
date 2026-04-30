import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
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
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

