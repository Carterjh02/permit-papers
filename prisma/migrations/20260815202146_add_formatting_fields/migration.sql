/*
  Warnings:

  - You are about to drop the column `defaultFont` on the `CompanyPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `defaultTheme` on the `CompanyPreferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CompanyPreferences" DROP COLUMN "defaultFont",
DROP COLUMN "defaultTheme",
ADD COLUMN     "defaultAddressCase" TEXT,
ADD COLUMN     "defaultDocumentFont" TEXT,
ADD COLUMN     "defaultNameCase" TEXT;
