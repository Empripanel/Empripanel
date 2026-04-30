import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header('Authorization');

  if (!header) {
    return res.status(401).json({ success: false, message: 'Missing Authorization header' });
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Invalid Authorization format' });
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

/** Sets req.user when a valid Bearer token is present; otherwise continues without auth. */
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.header('Authorization');
  if (!header) {
    return next();
  }
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
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

