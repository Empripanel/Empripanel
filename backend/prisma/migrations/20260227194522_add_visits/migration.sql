-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "clickCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_userId_idx" ON "Visit"("userId");

-- CreateIndex
CREATE INDEX "Visit_businessId_idx" ON "Visit"("businessId");

-- CreateIndex
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
