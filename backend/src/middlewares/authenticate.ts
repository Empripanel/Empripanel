import { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME } from '../utils/authCookie';
import { verifyAuthToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';

function bearerToken(header?: string): string | undefined {
  if (!header) return undefined;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return undefined;
  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function extractAuthToken(req: Request): string | undefined {
  const fromHeader = bearerToken(req.header('Authorization'));
  if (fromHeader) return fromHeader;
  const fromCookie = req.cookies?.[AUTH_COOKIE_NAME];
  return typeof fromCookie === 'string' && fromCookie.length > 0 ? fromCookie : undefined;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractAuthToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing or invalid authentication' });
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, role: true, createdAt: true, isDeleted: true },
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (user.isDeleted) {
      return res.status(401).json({ success: false, message: 'Account does not exist.' });
    }
    const { isDeleted: _isDeleted, ...userWithoutDeleted } = user;
    req.auth = { userId: user.id, role: user.role };
    req.user = userWithoutDeleted;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/** Sets req.user when a valid Bearer token or auth cookie is present; otherwise continues without auth. */
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const token = extractAuthToken(req);
  if (!token) {
    return next();
  }
  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, role: true, createdAt: true, isDeleted: true },
    });
    if (user && !user.isDeleted) {
      const { isDeleted: _isDeleted, ...userWithoutDeleted } = user;
      req.auth = { userId: user.id, role: user.role };
      req.user = userWithoutDeleted;
    }
  } catch {
    // ignore invalid token for optional auth
  }
  return next();
}

