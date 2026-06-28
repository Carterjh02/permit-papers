/*
  Warnings:

  - You are about to drop the column `autofillPath` on the `FormFieldMapping` table. All the data in the column will be lost.
  - You are about to drop the column `defaultValue` on the `FormFieldMapping` table. All the data in the column will be lost.
  - Added the required column `mappedTo` to the `FormFieldMapping` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FormFieldMapping` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FormFieldMapping" DROP COLUMN "autofillPath",
DROP COLUMN "defaultValue",
ADD COLUMN     "mappedTo" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
