import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';

export async function toggleLike(userId: number, businessId: string) {
  return prisma.$transaction(async (tx) => {
    const business = await tx.business.findUnique({
      where: { id: businessId },
      select: { id: true, likeCount: true },
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const existingLike = await tx.like.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (existingLike) {
      await tx.like.delete({
        where: {
          userId_businessId: {
            userId,
            businessId,
          },
        },
      });

      const newCount = Math.max(0, business.likeCount - 1);
      const updated = await tx.business.update({
        where: { id: businessId },
        data: { likeCount: newCount },
        select: { likeCount: true },
      });

      return {
        liked: false,
        likeCount: updated.likeCount,
      };
    }

    await tx.like.create({
      data: {
        userId,
        businessId,
      },
    });

    const updated = await tx.business.update({
      where: { id: businessId },
      data: { likeCount: business.likeCount + 1 },
      select: { likeCount: true },
    });

    return {
      liked: true,
      likeCount: updated.likeCount,
    };
  });
}

export async function getUserLikedBusinesses(userId: number) {
  const likes = await prisma.like.findMany({
    where: {
      userId,
      business: { hidden: false },
    },
    include: {
      business: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return likes
    .map((like) => like.business)
    .filter((business) => business != null);
}

