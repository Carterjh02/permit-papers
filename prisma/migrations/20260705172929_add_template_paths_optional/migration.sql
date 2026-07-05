-- AlterTable
ALTER TABLE "JobDocument" ADD COLUMN     "templateOutputPath" TEXT,
ADD COLUMN     "templateSourcePath" TEXT,
ALTER COLUMN "templatePath" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "JobDocument" ADD CONSTRAINT "JobDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
