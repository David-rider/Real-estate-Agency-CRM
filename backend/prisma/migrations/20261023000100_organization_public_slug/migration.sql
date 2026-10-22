-- Each brokerage gets its own public listings page, addressed by a slug.
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Backfill: readable name + short id suffix keeps it unique
UPDATE "Organization"
   SET "slug" = COALESCE(NULLIF(left(trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g')), 40), ''), 'brokerage')
                || '-' || substr(replace("id", '-', ''), 1, 6)
 WHERE "slug" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
