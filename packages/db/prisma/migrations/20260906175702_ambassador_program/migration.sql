-- CreateEnum
CREATE TYPE "AmbassadorStatus" AS ENUM ('ACTIVE', 'PAUSED', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'SIGNED_UP', 'UNDER_REVIEW', 'ACTIVE', 'CANCELED');

-- CreateEnum
CREATE TYPE "CommissionKind" AS ENUM ('BONUS', 'RECURRING');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReferralEventType" AS ENUM ('LINK_ACCESSED', 'SIGNUP_STARTED', 'SIGNUP_COMPLETED', 'ESTABLISHMENT_ACTIVATED', 'PLAN_SUBSCRIBED', 'PAYMENT_CONFIRMED', 'COMMISSION_CREATED', 'COMMISSION_APPROVED', 'COMMISSION_CANCELED', 'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_PAID');

-- CreateEnum
CREATE TYPE "CommissionModel" AS ENUM ('ONE_TIME', 'RECURRING', 'HYBRID');

-- CreateEnum
CREATE TYPE "CommissionValueType" AS ENUM ('PERCENT', 'FIXED');

-- CreateTable
CREATE TABLE "ambassador_profiles" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AmbassadorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "removedAt" TIMESTAMP(3),
    "createdByAdminId" TEXT,

    CONSTRAINT "ambassador_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "referredEstablishmentId" TEXT,
    "visitorRef" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "kind" "CommissionKind" NOT NULL,
    "periodKey" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_withdrawals" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedByAdminId" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "ambassador_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_events" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "referralId" TEXT,
    "type" "ReferralEventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_program_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "commissionModel" "CommissionModel" NOT NULL DEFAULT 'HYBRID',
    "commissionType" "CommissionValueType" NOT NULL DEFAULT 'FIXED',
    "bonusAmount" DECIMAL(10,2),
    "recurringPercent" DECIMAL(5,2),
    "recurringFixed" DECIMAL(10,2),
    "minWithdrawalAmount" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "approvalPeriodDays" INTEGER NOT NULL DEFAULT 7,
    "cancellationRules" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByAdminId" TEXT,

    CONSTRAINT "ambassador_program_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ambassador_profiles_establishmentId_key" ON "ambassador_profiles"("establishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ambassador_profiles_code_key" ON "ambassador_profiles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referredEstablishmentId_key" ON "referrals"("referredEstablishmentId");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_visitorRef_key" ON "referrals"("visitorRef");

-- CreateIndex
CREATE INDEX "referrals_ambassadorId_idx" ON "referrals"("ambassadorId");

-- CreateIndex
CREATE INDEX "commissions_ambassadorId_idx" ON "commissions"("ambassadorId");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_ambassadorId_referralId_kind_periodKey_key" ON "commissions"("ambassadorId", "referralId", "kind", "periodKey");

-- CreateIndex
CREATE INDEX "ambassador_withdrawals_ambassadorId_idx" ON "ambassador_withdrawals"("ambassadorId");

-- CreateIndex
CREATE INDEX "referral_events_ambassadorId_idx" ON "referral_events"("ambassadorId");

-- CreateIndex
CREATE INDEX "referral_events_referralId_idx" ON "referral_events"("referralId");

-- AddForeignKey
ALTER TABLE "ambassador_profiles" ADD CONSTRAINT "ambassador_profiles_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredEstablishmentId_fkey" FOREIGN KEY ("referredEstablishmentId") REFERENCES "establishments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_withdrawals" ADD CONSTRAINT "ambassador_withdrawals_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassador_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

