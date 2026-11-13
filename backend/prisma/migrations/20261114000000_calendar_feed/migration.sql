-- Private calendar subscription link (ICS feed): only the SHA-256 hash of the token is stored
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "calendarFeedTokenHash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_calendarFeedTokenHash_key" ON "User"("calendarFeedTokenHash");
