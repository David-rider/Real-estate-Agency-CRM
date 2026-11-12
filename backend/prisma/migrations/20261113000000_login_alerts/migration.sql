-- Login alerts: per-user switch and the hashed devices already seen
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "knownDevices" JSONB;
