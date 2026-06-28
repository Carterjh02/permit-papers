/*
  Warnings:

  - Added the required column `county` to the `FormTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentType` to the `FormTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `FormTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FormTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FormTemplate" ADD COLUMN     "county" TEXT NOT NULL,
ADD COLUMN     "documentType" TEXT NOT NULL,
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "storagePath" DROP NOT NULL;
