import { prisma } from '../utils/prisma';

const TOP_LIMIT = 10;
const NEW_BUSINESSES_LIMIT = 20;
const NEW_DAYS = 20;

/** Hidden businesses are excluded everywhere. */
const visible = { hidden: false };

export async function topClickedBusinesses() {
  return prisma.business.findMany({
    where: visible,
    orderBy: { clickCount: 'desc' },
    take: TOP_LIMIT,
  });
}

export async function topLikedBusinesses() {
  return prisma.business.findMany({
    where: visible,
    orderBy: { likeCount: 'desc' },
    take: TOP_LIMIT,
  });
}

export async function newBusinesses() {
  const since = new Date(Date.now() - NEW_DAYS * 24 * 60 * 60 * 1000);

  return prisma.business.findMany({
    where: {
      hidden: false,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: NEW_BUSINESSES_LIMIT,
  });
}
