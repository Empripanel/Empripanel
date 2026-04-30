import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppError } from './errors';

export type AuthTokenPayload = {
  userId: number;
  role: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError('JWT_SECRET is not configured', 500);
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload | string;
  if (typeof decoded === 'string') throw new AppError('Invalid token', 401);

  const userId = decoded.userId;
  const role = decoded.role;

  if (typeof userId !== 'number' || typeof role !== 'string') {
    throw new AppError('Invalid token payload', 401);
  }

  return { userId, role };
}

