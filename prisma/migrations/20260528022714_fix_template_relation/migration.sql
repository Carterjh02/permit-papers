/*
  Warnings:

  - You are about to drop the column `documentType` on the `FormTemplate` table. All the data in the column will be lost.
  - Added the required column `formType` to the `FormTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FormTemplate" DROP COLUMN "documentType",
ADD COLUMN     "formType" TEXT NOT NULL,
ADD COLUMN     "mapping" JSONB,
ADD COLUMN     "municipality" TEXT;
