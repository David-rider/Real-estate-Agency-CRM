-- Personal annual commission goal (net, paid commissions in the fiscal year). NULL = no goal set.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "annualCommissionGoal" DOUBLE PRECISION;
