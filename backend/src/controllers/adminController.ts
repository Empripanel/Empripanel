import { Request, Response, NextFunction } from 'express';
import { listHiddenBusinesses } from '../services/businessService';
import { resetUserPasswordByUsername } from '../services/adminService';

export async function getHiddenBusinesses(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businesses = await listHiddenBusinesses();
    return res.status(200).json(businesses);
  } catch (err) {
    return next(err);
  }
}

export async function resetPasswordForUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { username, newPassword } = req.body ?? {};
    await resetUserPasswordByUsername(username, newPassword);
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return next(err);
  }
}
