-- Lead priority (HOT / WARM / COLD)
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "temperature" TEXT DEFAULT 'WARM';

-- Commission defaults used when a deal closes
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "defaultCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 3;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "defaultFirmSplit" DOUBLE PRECISION NOT NULL DEFAULT 30;

-- Per-deal commission rate override
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION;
