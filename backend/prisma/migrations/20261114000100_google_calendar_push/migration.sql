-- Google Calendar push: encrypted refresh token per user, and the Google event linked to each appointment
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gcalRefreshTokenEnc" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gcalEmail" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "gcalEventId" TEXT;
