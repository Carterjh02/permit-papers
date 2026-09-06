/*
  Warnings:

  - You are about to drop the column `roofingLisenseNumber` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "roofingLisenseNumber",
ADD COLUMN     "roofingLicenseNumber" TEXT;
