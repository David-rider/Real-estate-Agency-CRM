-- Brings the database up to the schema that earlier migrations never captured
-- (several tables and columns were added with `prisma db push`).
-- Every statement is idempotent, so this is safe on both a fresh database and
-- one that was already synced with `db push`.


DO $$ BEGIN
    CREATE TYPE "ClientFunnel" AS ENUM ('LEAD', 'QUALIFIED', 'SHOWING', 'OFFERING', 'IN_CONTRACT', 'CLOSED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTER', 'WITHDRAWN', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AppointStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ApptType" AS ENUM ('SHOWING', 'MEETING', 'CALL', 'OPEN_HOUSE', 'INSPECTION', 'CLOSING', 'FOLLOW_UP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotifType" AS ENUM ('NEW_CLIENT', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'APPOINTMENT_REMINDER', 'TRANSACTION_UPDATE', 'COMMISSION_PAID', 'TASK_DUE', 'DOCUMENT_SIGNED', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "ClientStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'RENTER';

ALTER TYPE "ClientType" ADD VALUE IF NOT EXISTS 'INVESTOR';

ALTER TYPE "CommStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

ALTER TYPE "PropStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';

ALTER TYPE "PropStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "coAgentId" TEXT;

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "funnelStage" "ClientFunnel" NOT NULL DEFAULT 'LEAD';

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP(3);

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "preferredContact" TEXT;

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "source" TEXT;

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "tags" TEXT;

ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "targetMoveDate" TIMESTAMP(3);

ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "Commission" ADD COLUMN IF NOT EXISTS "orgId" TEXT;

UPDATE "Commission" c SET "orgId" = t."orgId" FROM "Transaction" t WHERE c."transactionId" = t."id" AND c."orgId" IS NULL;

ALTER TABLE "Commission" ALTER COLUMN "orgId" SET NOT NULL;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "address" TEXT;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "phone" TEXT;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "website" TEXT;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "daysOnMarket" INTEGER;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "expirationDate" TIMESTAMP(3);

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "featuredImage" TEXT;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "hoaFee" DOUBLE PRECISION;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "listingDate" TIMESTAMP(3);

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "mlsNumber" TEXT;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "neighborhood" TEXT;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "parkingSpaces" INTEGER;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "propertyType" TEXT;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "virtualTourUrl" TEXT;

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "yearBuilt" INTEGER;

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "acceptedPrice" DOUBLE PRECISION;

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "boardPackageDate" TIMESTAMP(3);

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "clearToCloseDate" TIMESTAMP(3);

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "closingDate" TIMESTAMP(3);

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "coAgentId" TEXT;

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "contingencies" TEXT;

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "contractDate" TIMESTAMP(3);

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "inspectionDate" TIMESTAMP(3);

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "appleId" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifyToken" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedIn" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpiry" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/New_York';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "title" TEXT;

ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "Offer" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "counterAmount" DOUBLE PRECISION,
    "propertyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "mimeType" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "signatureRequired" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "uploadedById" TEXT,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" "AppointStatus" NOT NULL DEFAULT 'SCHEDULED',
    "type" "ApptType" NOT NULL DEFAULT 'MEETING',
    "durationMin" INTEGER DEFAULT 60,
    "location" TEXT,
    "virtualLink" TEXT,
    "confirmationSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "colorCode" TEXT,
    "agentId" TEXT NOT NULL,
    "clientId" TEXT,
    "propertyId" TEXT,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sizeBytes" INTEGER,
    "propertyId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MarketingTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "channel" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "agentId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketingTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "feeAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GiftOrder" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ORDERED',
    "amount" DOUBLE PRECISION,
    "trackingNum" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GiftOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "linkedClientId" TEXT,
    "linkedPropertyId" TEXT,
    "linkedTransactionId" TEXT,
    "agentId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NOTE',
    "clientId" TEXT,
    "propertyId" TEXT,
    "transactionId" TEXT,
    "authorId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotifType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "link" TEXT,
    "metadata" TEXT,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" TEXT,
    "after" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");

CREATE UNIQUE INDEX IF NOT EXISTS "User_appleId_key" ON "User"("appleId");

DO $$ BEGIN
    ALTER TABLE "Commission" ADD CONSTRAINT "Commission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Offer" ADD CONSTRAINT "Offer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Document" ADD CONSTRAINT "Document_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Document" ADD CONSTRAINT "Document_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "MarketingTask" ADD CONSTRAINT "MarketingTask_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "MarketingTask" ADD CONSTRAINT "MarketingTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Referral" ADD CONSTRAINT "Referral_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "GiftOrder" ADD CONSTRAINT "GiftOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "GiftOrder" ADD CONSTRAINT "GiftOrder_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "GiftOrder" ADD CONSTRAINT "GiftOrder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Note" ADD CONSTRAINT "Note_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Note" ADD CONSTRAINT "Note_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Note" ADD CONSTRAINT "Note_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
