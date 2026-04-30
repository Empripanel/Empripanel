import { Request, Response, NextFunction } from 'express';
import * as usersService from '../services/usersService';
import { getUserLikedBusinesses } from '../services/likeService';
import { getUserVisitHistory, getUserAllVisitedBusinessIds } from '../services/visitService';
import { getUserReportedBusinessIds } from '../services/reportService';

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const { email } = req.body ?? {};
    const user = await usersService.updateEmail(userId, email);
    return res.json({ message: 'Email updated successfully', user });
  } catch (err) {
    return next(err);
  }
}

export async function updatePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body ?? {};
    await usersService.changePassword(userId, currentPassword, newPassword, confirmPassword);
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return next(err);
  }
}

export async function deleteMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    await usersService.deleteUser(userId);
    return res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    return next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const role = await usersService.switchRole(userId);
    return res.json({ message: 'Role updated successfully', role });
  } catch (err) {
    return next(err);
  }
}

export async function getLikedBusinesses(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const businesses = await getUserLikedBusinesses(userId);
    return res.json(businesses);
  } catch (err) {
    return next(err);
  }
}

/** Persisted click (visit) and report flags for syncing UI across sessions. */
export async function getInteractionState(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const [visitedBusinessIds, reportedBusinessIds] = await Promise.all([
      getUserAllVisitedBusinessIds(userId),
      getUserReportedBusinessIds(userId),
    ]);
    return res.json({ visitedBusinessIds, reportedBusinessIds });
  } catch (err) {
    return next(err);
  }
}

export async function getVisitHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.userId;
    const history = await getUserVisitHistory(userId);
    return res.json(history);
  } catch (err) {
    return next(err);
  }
}


