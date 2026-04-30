import { Request, Response, NextFunction } from 'express';
import {
  createBusiness as createBusinessService,
  listBusinesses,
  listBusinessesByCategory,
  searchBusinesses,
  updateBusiness as updateBusinessService,
  deleteBusiness as deleteBusinessService,
  hideBusiness as hideBusinessService,
  restoreBusiness as restoreBusinessService,
} from '../services/businessService';
import { createBusinessSchema } from '../validators/business.schema';
import { CATEGORIES } from '../shared/categories';
import { prisma } from '../utils/prisma';
import { toggleLike } from '../services/likeService';
import { registerClick } from '../services/visitService';
import { toggleReport } from '../services/reportService';

export async function getPanel(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const businesses = await prisma.business.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(businesses);
  } catch (err) {
    return next(err);
  }
}

export async function createBusiness(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const parsed = createBusinessSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const ownerId = req.user.id;
    const business = await createBusinessService(ownerId, parsed.data);
    return res.status(201).json(business);
  } catch (err) {
    return next(err);
  }
}

export async function list(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businesses = await listBusinesses();
    return res.status(200).json(businesses);
  } catch (err) {
    return next(err);
  }
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

export async function getFeaturedCategory(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const values = CATEGORIES.map((c) => c.value);
    const dayOfYear = getDayOfYear(new Date());
    const index = dayOfYear % values.length;
    const featuredCategory = values[index];
    return res.status(200).json({ featuredCategory });
  } catch (err) {
    return next(err);
  }
}

export async function search(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const businesses = await searchBusinesses(q);
    return res.status(200).json(businesses);
  } catch (err) {
    return next(err);
  }
}

export async function listByCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const category = typeof req.params.category === 'string' ? req.params.category : '';
    const businesses = await listBusinessesByCategory(category);
    return res.status(200).json(businesses);
  } catch (err) {
    return next(err);
  }
}

export async function getBusinessById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businessId = req.params.id;
    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.hidden && req.user?.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Business not found' });
    }

    return res.status(200).json(business);
  } catch (err) {
    return next(err);
  }
}

export async function updateBusiness(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const businessId = req.params.id;
    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    const parsed = createBusinessSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: parsed.error.flatten(),
      });
    }

    const business = await updateBusinessService(businessId, req.user.id, parsed.data, req.user.role);
    return res.status(200).json(business);
  } catch (err) {
    return next(err);
  }
}

export async function deleteBusiness(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const businessId = req.params.id;
    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    await deleteBusinessService(businessId, req.user.id, req.user.role);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function toggleBusinessLike(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const businessId = req.params.id;
    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    const result = await toggleLike(req.user.id, businessId);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function toggleBusinessReport(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const businessId = req.params.id;
    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    const result = await toggleReport(req.user.id, businessId);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function registerBusinessClick(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const businessId = req.params.id;
    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    const result = await registerClick(businessId, req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function hideBusiness(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businessId = req.params.id;
    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }
    const business = await hideBusinessService(businessId);
    return res.status(200).json(business);
  } catch (err) {
    return next(err);
  }
}

export async function restoreBusiness(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const businessId = req.params.id;
    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }
    const business = await restoreBusinessService(businessId);
    return res.status(200).json(business);
  } catch (err) {
    return next(err);
  }
}


