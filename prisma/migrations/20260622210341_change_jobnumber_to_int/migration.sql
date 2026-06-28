-- 1. Add a temporary integer column
ALTER TABLE "Job"
ADD COLUMN "jobNumber_int" INTEGER;

-- 2. Copy converted values
UPDATE "Job"
SET "jobNumber_int" = CAST("jobNumber" AS INTEGER);

-- 3. Drop the old column
ALTER TABLE "Job"
DROP COLUMN "jobNumber";

-- 4. Rename the new column
ALTER TABLE "Job"
RENAME COLUMN "jobNumber_int" TO "jobNumber";
