-- Automated lead routing rules and per-agent lead capacity controls.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "acceptingLeads" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "maxActiveLeads" INTEGER;

CREATE TABLE IF NOT EXISTS "LeadRoutingRule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "city" TEXT,
    "propertyType" TEXT,
    "minPrice" DOUBLE PRECISION,
    "maxPrice" DOUBLE PRECISION,
    "strategy" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    "targetAgentId" TEXT,
    "lastAssignedIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadRoutingRule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeadRoutingRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "LeadRoutingRule_orgId_priority_idx" ON "LeadRoutingRule"("orgId", "priority");
