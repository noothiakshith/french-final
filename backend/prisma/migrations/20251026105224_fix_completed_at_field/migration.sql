-- AlterTable
ALTER TABLE "test_attempts" ALTER COLUMN "completedAt" DROP NOT NULL,
ALTER COLUMN "completedAt" DROP DEFAULT;
