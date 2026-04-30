import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';

export async function registerClick(businessId: string, userId: number) {
  const existing = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Business not found', 404);
  }

  return prisma.$transaction(async (tx) => {
    const updatedBusiness = await tx.business.update({
      where: { id: businessId },
      data: {
        clickCount: {
          increment: 1,
        },
      },
      select: { clickCount: true },
    });

    // Remove any existing visit for this user+business so history has at most one per business
    await tx.visit.deleteMany({
      where: { userId, businessId },
    });

    await tx.visit.create({
      data: {
        userId,
        businessId,
      },
    });

    return { clickCount: updatedBusiness.clickCount };
  });
}

/** All business IDs this user has ever registered a click for (one row per business). */
export async function getUserAllVisitedBusinessIds(userId: number): Promise<string[]> {
  const visits = await prisma.visit.findMany({
    where: { userId },
    select: { businessId: true },
  });
  return [...new Set(visits.map((v) => v.businessId))];
}

export async function getUserVisitHistory(userId: number) {
  const visits = await prisma.visit.findMany({
    where: {
      userId,
      business: { hidden: false },
    },
    include: {
      business: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return visits
    .filter((v) => v.business != null)
    .map((v) => ({
      business: v.business,
      visitedAt: v.createdAt,
    }));
}

