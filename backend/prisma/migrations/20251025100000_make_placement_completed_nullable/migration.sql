-- Make placement_tests.completedAt nullable and remove default
ALTER TABLE "placement_tests" ALTER COLUMN "completedAt" DROP DEFAULT;
ALTER TABLE "placement_tests" ALTER COLUMN "completedAt" DROP NOT NULL;
