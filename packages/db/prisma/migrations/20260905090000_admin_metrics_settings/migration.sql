-- AlterTable: establishments — acquisition channel for analytics
ALTER TABLE "establishments" ADD COLUMN "acquisitionChannel" TEXT NOT NULL DEFAULT 'organic';

-- AlterTable: platform_settings — CAC / fee / note inputs
ALTER TABLE "platform_settings" ADD COLUMN "marketingSpendMonthly" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN "paymentFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "platform_settings" ADD COLUMN "note" TEXT NOT NULL DEFAULT '';
