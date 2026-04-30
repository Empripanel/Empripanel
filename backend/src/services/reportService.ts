import { prisma } from '../utils/prisma';
import { AppError } from '../utils/errors';

export async function getUserReportedBusinessIds(userId: number): Promise<string[]> {
  const reports = await prisma.report.findMany({
    where: { userId },
    select: { businessId: true },
  });
  return reports.map((r) => r.businessId);
}

export async function toggleReport(userId: number, businessId: string) {
  return prisma.$transaction(async (tx) => {
    const business = await tx.business.findUnique({
      where: { id: businessId },
      select: { id: true, reportCount: true },
    });

    if (!business) {
      throw new AppError('Business not found', 404);
    }

    const existingReport = await tx.report.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
    });

    if (existingReport) {
      await tx.report.delete({
        where: {
          userId_businessId: {
            userId,
            businessId,
          },
        },
      });

      const newCount = Math.max(0, business.reportCount - 1);
      const updated = await tx.business.update({
        where: { id: businessId },
        data: { reportCount: newCount },
        select: { reportCount: true },
      });

      return {
        reported: false,
        reportCount: updated.reportCount,
      };
    }

    await tx.report.create({
      data: {
        userId,
        businessId,
      },
    });

    const newCount = business.reportCount + 1;
    const updated = await tx.business.update({
      where: { id: businessId },
      data: {
        reportCount: newCount,
        ...(newCount >= 3 ? { hidden: true } : {}),
      },
      select: { reportCount: true },
    });

    return {
      reported: true,
      reportCount: updated.reportCount,
    };
  });
}
