-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EXPLORER', 'BUSINESS', 'ADMIN');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "username" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'EXPLORER';

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

