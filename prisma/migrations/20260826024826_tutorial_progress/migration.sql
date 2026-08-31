/*
  Warnings:

  - You are about to drop the column `roofingBusinessTaxReceipt` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `roofingDescOfImprov` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `roofingLicenseNumber` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `roofingQualifierName` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `tutorialEnabled` on the `UserPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `tutorialStep` on the `UserPreferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "roofingBusinessTaxReceipt",
DROP COLUMN "roofingDescOfImprov",
DROP COLUMN "roofingLicenseNumber",
DROP COLUMN "roofingQualifierName";

-- AlterTable
ALTER TABLE "UserPreferences" DROP COLUMN "tutorialEnabled",
DROP COLUMN "tutorialStep";

-- CreateTable
CREATE TABLE "TutorialProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "currentSection" TEXT,
    "currentStep" INTEGER DEFAULT 0,
    "completedSections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,

    CONSTRAINT "TutorialProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TutorialProgress_userId_key" ON "TutorialProgress"("userId");

-- AddForeignKey
ALTER TABLE "TutorialProgress" ADD CONSTRAINT "TutorialProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
