-- Free Elite trial for new brokerages: every internal member has Elite until this moment
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
