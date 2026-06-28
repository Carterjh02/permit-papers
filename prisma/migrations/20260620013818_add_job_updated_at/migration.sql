-- 1. Add the column with a default so existing rows get a value
ALTER TABLE "Job"
ADD COLUMN "updatedAt" TIMESTAMP DEFAULT NOW();

-- 2. Backfill existing rows (safety)
UPDATE "Job" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- 3. Make the column required
ALTER TABLE "Job"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- 4. Remove the default so Prisma controls updates
ALTER TABLE "Job"
ALTER COLUMN "updatedAt" DROP DEFAULT;
