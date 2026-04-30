-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "reportCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Report_businessId_idx" ON "Report"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_userId_businessId_key" ON "Report"("userId", "businessId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
