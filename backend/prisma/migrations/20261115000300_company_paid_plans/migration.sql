-- A brokerage can pay for its members: per-member level, and the plan each member pays for themselves
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "companyPlan" "Tier";
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "companyCycle" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyTier" "Tier";
-- selfTier starts as the plan each member has today; only done when the column is first created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'selfTier') THEN
    ALTER TABLE "User" ADD COLUMN "selfTier" "Tier" NOT NULL DEFAULT 'CORE';
    UPDATE "User" SET "selfTier" = "tier";
  END IF;
END $$;
