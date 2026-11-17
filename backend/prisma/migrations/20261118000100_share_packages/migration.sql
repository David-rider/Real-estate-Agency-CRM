-- Shared document packages: links that let people outside the brokerage view chosen documents, with view tracking
CREATE TABLE IF NOT EXISTS "SharePackage" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "propertyId" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SharePackage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SharePackage_orgId_createdById_idx" ON "SharePackage"("orgId", "createdById");

CREATE TABLE IF NOT EXISTS "SharePackageDocument" (
    "packageId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SharePackageDocument_pkey" PRIMARY KEY ("packageId", "documentId")
);

CREATE TABLE IF NOT EXISTS "ShareLink" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "requireEmail" BOOLEAN NOT NULL DEFAULT true,
    "requireNda" BOOLEAN NOT NULL DEFAULT false,
    "ndaText" TEXT,
    "watermark" BOOLEAN NOT NULL DEFAULT true,
    "allowDownload" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ShareLink_token_key" ON "ShareLink"("token");

CREATE TABLE IF NOT EXISTS "ShareView" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "viewerEmail" TEXT,
    "ndaAcceptedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "pages" JSONB,
    CONSTRAINT "ShareView_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ShareView_sessionToken_key" ON "ShareView"("sessionToken");
CREATE INDEX IF NOT EXISTS "ShareView_linkId_idx" ON "ShareView"("linkId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SharePackageDocument_packageId_fkey') THEN
        ALTER TABLE "SharePackageDocument" ADD CONSTRAINT "SharePackageDocument_packageId_fkey"
            FOREIGN KEY ("packageId") REFERENCES "SharePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SharePackageDocument_documentId_fkey') THEN
        ALTER TABLE "SharePackageDocument" ADD CONSTRAINT "SharePackageDocument_documentId_fkey"
            FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ShareLink_packageId_fkey') THEN
        ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_packageId_fkey"
            FOREIGN KEY ("packageId") REFERENCES "SharePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ShareView_linkId_fkey') THEN
        ALTER TABLE "ShareView" ADD CONSTRAINT "ShareView_linkId_fkey"
            FOREIGN KEY ("linkId") REFERENCES "ShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
