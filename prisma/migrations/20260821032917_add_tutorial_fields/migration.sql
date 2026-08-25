-- AlterTable
ALTER TABLE "UserPreferences" ADD COLUMN     "tutorialEnabled" BOOLEAN DEFAULT true,
ADD COLUMN     "tutorialStep" INTEGER DEFAULT 0;
