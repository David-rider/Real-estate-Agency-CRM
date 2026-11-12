-- Brokerage IP allowlist (addresses or CIDR ranges); empty = no restriction
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "ipAllowlist" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
