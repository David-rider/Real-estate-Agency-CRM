-- Email notification preferences per user and idempotent overdue task notification tracking.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationPrefs" JSONB;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "overdueNotified" BOOLEAN NOT NULL DEFAULT false;
