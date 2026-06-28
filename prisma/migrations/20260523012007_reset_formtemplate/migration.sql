/*
  Warnings:

  - You are about to drop the column `county` on the `FormTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `FormTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `formType` on the `FormTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `municipality` on the `FormTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `FormTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `FormTemplate` table. All the data in the column will be lost.
  - Added the required column `fieldNames` to the `FormTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storagePath` to the `FormTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FormTemplate" DROP COLUMN "county",
DROP COLUMN "description",
DROP COLUMN "formType",
DROP COLUMN "municipality",
DROP COLUMN "pdfUrl",
DROP COLUMN "updatedAt",
ADD COLUMN     "fieldNames" JSONB NOT NULL,
ADD COLUMN     "storagePath" TEXT NOT NULL;
