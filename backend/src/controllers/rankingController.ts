import { Request, Response, NextFunction } from 'express';
import {
  topClickedBusinesses,
  topLikedBusinesses,
  newBusinesses,
} from '../services/rankingService';

export async function getTopClicked(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businesses = await topClickedBusinesses();
    return res.status(200).json(businesses);
  } catch (err) {
    return next(err);
  }
}

export async function getTopLiked(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businesses = await topLikedBusinesses();
    return res.status(200).json(businesses);
  } catch (err) {
    return next(err);
  }
}

export async function getNewBusinesses(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businesses = await newBusinesses();
    return res.status(200).json(businesses);
  } catch (err) {
    return next(err);
  }
}
