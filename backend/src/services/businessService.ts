import { prisma } from '../utils/prisma';
import type { Business } from '@prisma/client';
import { AppError } from '../utils/errors';

export function getPanelPayload() {
  return {
    message: 'Welcome to My Panel',
    access: 'BUSINESS_GRANTED',
  };
}

function trim(s: unknown): string | null {
  if (s == null) return null;
  if (typeof s !== 'string') return null;
  const t = s.trim();
  return t === '' ? null : t;
}

export async function createBusiness(ownerId: number, body: Record<string, unknown>) {
  const name = trim(body.name);
  const category = trim(body.category);
  const bannerImageUrl = trim(body.bannerImageUrl);
  const redirectUrl = trim(body.redirectUrl);
  const slogan = trim(body.slogan);
  const description = trim(body.description);

  if (!name) throw new AppError('name is required', 400);
  if (!category) throw new AppError('category is required', 400);
  if (!bannerImageUrl) throw new AppError('bannerImageUrl is required', 400);
  if (!redirectUrl) throw new AppError('redirectUrl is required', 400);
  if (!slogan) throw new AppError('slogan is required', 400);
  if (!description) throw new AppError('description is required', 400);

  const business = await prisma.business.create({
    data: {
      ownerId,
      name,
      category,
      bannerImageUrl,
      redirectUrl,
      slogan,
      description,
      location: trim(body.location) ?? undefined,
      phone: trim(body.phone) ?? undefined,
      contactEmail: trim(body.contactEmail) ?? undefined,
      website: trim(body.website) ?? undefined,
      instagram: trim(body.instagram) ?? undefined,
      tiktok: trim(body.tiktok) ?? undefined,
      x: trim(body.x) ?? undefined,
      linkedin: trim(body.linkedin) ?? undefined,
      facebook: trim(body.facebook) ?? undefined,
      youtube: trim(body.youtube) ?? undefined,
    },
  });

  return business;
}

export async function listBusinesses() {
  return prisma.business.findMany({
    where: { hidden: false },
    orderBy: { createdAt: 'desc' },
  });
}

export async function searchBusinesses(query: string) {
  const q = typeof query === 'string' ? query.trim() : '';
  if (!q) return [];
  const pattern = `%${q}%`;
  const rows = await prisma.$queryRaw<Business[]>`
    SELECT * FROM "Business"
    WHERE (unaccent(lower("name")) LIKE unaccent(lower(${pattern}))
       OR unaccent(lower("description")) LIKE unaccent(lower(${pattern}))
       OR unaccent(lower("category")) LIKE unaccent(lower(${pattern}))
       OR unaccent(lower("slogan")) LIKE unaccent(lower(${pattern})))
       AND "hidden" = false
    ORDER BY "createdAt" DESC
  `;
  return rows;
}

export async function listBusinessesByCategory(category: string) {
  const cat = typeof category === 'string' ? category.trim() : '';
  if (!cat) return [];
  const rows = await prisma.$queryRaw<Business[]>`
    SELECT * FROM "Business"
    WHERE unaccent(lower("category")) = unaccent(lower(${cat}))
      AND "hidden" = false
    ORDER BY "createdAt" DESC
  `;
  return rows;
}
export async function updateBusiness(
  businessId: string,
  ownerId: number,
  body: Record<string, unknown>,
  callerRole?: string
) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  const isOwner = business.ownerId === ownerId;
  const isAdmin = callerRole === 'ADMIN';
  if (!isOwner && !isAdmin) throw new AppError('Forbidden', 403);

  const name = trim(body.name);
  const category = trim(body.category);
  const bannerImageUrl = trim(body.bannerImageUrl);
  const redirectUrl = trim(body.redirectUrl);
  const slogan = trim(body.slogan);
  const description = trim(body.description);

  if (!name) throw new AppError('name is required', 400);
  if (!category) throw new AppError('category is required', 400);
  if (!bannerImageUrl) throw new AppError('bannerImageUrl is required', 400);
  if (!redirectUrl) throw new AppError('redirectUrl is required', 400);
  if (!slogan) throw new AppError('slogan is required', 400);
  if (!description) throw new AppError('description is required', 400);

  return prisma.business.update({
    where: { id: businessId },
    data: {
      name,
      category,
      bannerImageUrl,
      redirectUrl,
      slogan,
      description,
      location: trim(body.location) ?? undefined,
      phone: trim(body.phone) ?? undefined,
      contactEmail: trim(body.contactEmail) ?? undefined,
      website: trim(body.website) ?? undefined,
      instagram: trim(body.instagram) ?? undefined,
      tiktok: trim(body.tiktok) ?? undefined,
      x: trim(body.x) ?? undefined,
      linkedin: trim(body.linkedin) ?? undefined,
      facebook: trim(body.facebook) ?? undefined,
      youtube: trim(body.youtube) ?? undefined,
    },
  });
}

export async function deleteBusiness(businessId: string, ownerId: number, callerRole?: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  const isOwner = business.ownerId === ownerId;
  const isAdmin = callerRole === 'ADMIN';
  if (!isOwner && !isAdmin) throw new AppError('Forbidden', 403);

  await prisma.business.delete({
    where: { id: businessId },
  });
}

export async function hideBusiness(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.business.update({
    where: { id: businessId },
    data: { hidden: true },
  });
}

export async function restoreBusiness(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.$transaction(async (tx) => {
    await tx.report.deleteMany({ where: { businessId } });
    return tx.business.update({
      where: { id: businessId },
      data: { hidden: false, reportCount: 0 },
    });
  });
}

export async function listHiddenBusinesses() {
  return prisma.business.findMany({
    where: { hidden: true },
    orderBy: { createdAt: 'desc' },
  });
}
