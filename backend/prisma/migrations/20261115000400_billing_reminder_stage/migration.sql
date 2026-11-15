-- Remembers which "choose a plan" reminder was already emailed to a member
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingReminderStage" INTEGER;
