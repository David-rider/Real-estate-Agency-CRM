-- Real file upload support for listing photos and private contract documents.
-- Stores uploaded binaries in Cloudflare R2 (when configured) or PostgreSQL bytea fallback.

ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "mimeType" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "storageKey" TEXT;

ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "storageKey" TEXT;

CREATE TABLE IF NOT EXISTS "UploadedFile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "r2Key" TEXT,
    "data" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UploadedFile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UploadedFile_orgId_idx" ON "UploadedFile"("orgId");
