-- Real account deactivation flag
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Backfill: existing accounts predate email-verification enforcement — grandfather
-- them in so enabling the email service doesn't lock out current users
UPDATE "User" SET "emailVerified" = true;
