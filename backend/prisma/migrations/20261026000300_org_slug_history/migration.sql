-- Custom organization slug history for permanent redirect and brand color support.

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "brandColor" TEXT;

CREATE TABLE IF NOT EXISTS "OrgSlugHistory" (
    "id" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgSlugHistory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrgSlugHistory_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrgSlugHistory_oldSlug_key" ON "OrgSlugHistory"("oldSlug");
CREATE INDEX IF NOT EXISTS "OrgSlugHistory_orgId_idx" ON "OrgSlugHistory"("orgId");
