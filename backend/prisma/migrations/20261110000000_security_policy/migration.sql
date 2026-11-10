-- Organization-wide security policy (session length, password rules) and password-change tracking.

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 1440;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "minPasswordLength" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "requirePasswordSpecialChar" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "passwordExpiryDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "logoutOnPasswordChange" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);
