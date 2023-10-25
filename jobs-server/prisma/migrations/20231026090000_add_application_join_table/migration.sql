-- Replace Job.applications (a TEXT[] of user ids) with a proper join table.
--
-- The array could not be indexed usefully, forced a read-modify-write to append an
-- applicant (two clients applying at once could lose one another's write), and was
-- serialised to every client on every job listing, leaking who had applied to what.

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_jobId_key" ON "Application"("userId", "jobId");

-- CreateIndex
CREATE INDEX "Application_jobId_idx" ON "Application"("jobId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing applications from the array before dropping it. Ids that no longer
-- match a user are skipped: the array had no foreign key, so it could hold anything.
INSERT INTO "Application" ("id", "userId", "jobId", "createdAt")
SELECT gen_random_uuid()::TEXT, applicant.user_id, "Job"."id", CURRENT_TIMESTAMP
FROM "Job"
CROSS JOIN LATERAL unnest("Job"."applications") AS applicant(user_id)
WHERE EXISTS (SELECT 1 FROM "User" WHERE "User"."id" = applicant.user_id)
ON CONFLICT ("userId", "jobId") DO NOTHING;

-- DropColumn
ALTER TABLE "Job" DROP COLUMN "applications";

-- CreateIndex
CREATE INDEX "Job_createdAt_id_idx" ON "Job"("createdAt", "id");

-- AlterTable
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
