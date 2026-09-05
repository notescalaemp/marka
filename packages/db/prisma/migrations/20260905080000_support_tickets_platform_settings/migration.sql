-- CreateEnum
CREATE TYPE "SupportTicketType" AS ENUM ('billing', 'technical', 'onboarding');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "type" "SupportTicketType" NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'medium',
    "customerName" TEXT NOT NULL,
    "establishmentId" TEXT,
    "createdById" TEXT,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "brandName" TEXT NOT NULL DEFAULT 'marka.ia',
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "features" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_status_priority_idx" ON "support_tickets"("status", "priority");
CREATE INDEX "support_tickets_establishmentId_idx" ON "support_tickets"("establishmentId");
CREATE INDEX "support_tickets_createdAt_idx" ON "support_tickets"("createdAt");

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "administrators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "administrators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "platform_settings" ("id", "brandName", "locale", "features", "updatedAt")
VALUES (
  'default',
  'marka.ia',
  'pt-BR',
  '{"impersonation":true,"auditLogs":true,"marketingCampaigns":true,"onlinePayments":false}'::jsonb,
  CURRENT_TIMESTAMP
);
