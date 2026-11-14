-- Lets the server end every existing session of one account (used when an unverified account is claimed through Google)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionsRevokedAt" TIMESTAMP(3);
