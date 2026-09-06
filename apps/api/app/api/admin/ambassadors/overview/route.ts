import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { syncAmbassadorConversions } from "@/lib/ambassador";

const periodSchema = z.enum(["7d", "30d", "90d", "12m"]);

function rangeFor(period: z.infer<typeof periodSchema>) {
  const now = new Date();
  const start = new Date(now);
  const bucket: "day" | "month" = period === "12m" ? "month" : "day";
  if (period === "7d") start.setUTCDate(start.getUTCDate() - 7);
  if (period === "30d") start.setUTCDate(start.getUTCDate() - 30);
  if (period === "90d") start.setUTCDate(start.getUTCDate() - 90);
  if (period === "12m") start.setUTCMonth(start.getUTCMonth() - 12);
  return { start, now, bucket };
}

function bucketKey(date: Date, bucket: "day" | "month") {
  return bucket === "day"
    ? date.toISOString().slice(0, 10)
    : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildBuckets(start: Date, now: Date, bucket: "day" | "month") {
  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= now) {
    keys.push(bucketKey(cursor, bucket));
    if (bucket === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

// GET: Overview cards (seção 3) + the evolution chart's series (seção 4).
// Real aggregates only — no fabricated growth curves.
export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");

  await syncAmbassadorConversions();

  const period = periodSchema.parse(req.nextUrl.searchParams.get("period") ?? "30d");
  const { start, now, bucket } = rangeFor(period);

  const [activeAmbassadors, totalReferrals, converted, commissionTotals, referralsInRange, commissionsInRange] =
    await Promise.all([
      db.ambassadorProfile.count({ where: { status: "ACTIVE" } }),
      db.referral.count({ where: { referredEstablishmentId: { not: null } } }),
      db.referral.count({ where: { convertedAt: { not: null } } }),
      db.commission.groupBy({ by: ["status"], _sum: { amount: true } }),
      db.referral.findMany({
        where: { createdAt: { gte: start, lte: now } },
        select: {
          createdAt: true,
          convertedAt: true,
          referredEstablishment: { select: { subscription: { select: { plan: { select: { priceMonthly: true } } } } } },
        },
      }),
      db.commission.findMany({
        where: { createdAt: { gte: start, lte: now }, status: { not: "CANCELED" } },
        select: { createdAt: true, amount: true },
      }),
    ]);

  const byStatus = Object.fromEntries(commissionTotals.map((t) => [t.status, Number(t._sum.amount ?? 0)]));
  const keys = buildBuckets(start, now, bucket);
  const series = new Map(keys.map((k) => [k, { date: k, referrals: 0, conversions: 0, revenue: 0, commissions: 0 }]));

  for (const r of referralsInRange) {
    const key = bucketKey(r.createdAt, bucket);
    const point = series.get(key);
    if (point) point.referrals += 1;
    if (r.convertedAt) {
      const convertedKey = bucketKey(r.convertedAt, bucket);
      const convertedPoint = series.get(convertedKey);
      if (convertedPoint) {
        convertedPoint.conversions += 1;
        convertedPoint.revenue += Number(r.referredEstablishment?.subscription?.plan.priceMonthly ?? 0);
      }
    }
  }
  for (const c of commissionsInRange) {
    const point = series.get(bucketKey(c.createdAt, bucket));
    if (point) point.commissions += Number(c.amount);
  }

  return ok({
    activeAmbassadors,
    totalReferrals,
    newCustomers: converted,
    conversionRate: totalReferrals > 0 ? Number(((converted / totalReferrals) * 100).toFixed(1)) : 0,
    commissionsGenerated: Number(
      commissionTotals.reduce((sum, t) => sum + Number(t._sum.amount ?? 0), 0).toFixed(2)
    ),
    commissionsPending: byStatus.PENDING ?? 0,
    commissionsPaid: byStatus.PAID ?? 0,
    series: Array.from(series.values()),
  });
});
