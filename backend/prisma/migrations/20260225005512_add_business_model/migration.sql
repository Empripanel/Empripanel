-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "bannerImageUrl" TEXT NOT NULL,
    "redirectUrl" TEXT NOT NULL,
    "slogan" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "phone" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "x" TEXT,
    "linkedin" TEXT,
    "facebook" TEXT,
    "youtube" TEXT,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
