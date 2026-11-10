-- Organization-wide policies (Settings > CRM / Properties / Finance / Appointments / Documents)
-- and per-user preferences (Settings > "My preferences"). NULL means "use the defaults".
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "policies" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferences" JSONB;
