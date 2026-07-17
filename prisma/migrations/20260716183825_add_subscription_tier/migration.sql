-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "subscriptionPlanId" TEXT,
ADD COLUMN     "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxJobsPerMonth" INTEGER,
    "maxActiveJobs" INTEGER,
    "priceMonthly" DOUBLE PRECISION,
    "features" JSONB,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

// force Vercel to regenerate Prisma Client