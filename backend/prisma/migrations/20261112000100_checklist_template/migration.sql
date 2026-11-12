-- A brokerage's own contract-to-close checklist. NULL = the standard checklist.
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "checklistTemplate" JSONB;
