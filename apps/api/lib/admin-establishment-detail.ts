import { db, Prisma } from "@marka/db";
import type { ScoredEstablishmentRow } from "./admin-establishments";

const DAY_MS = 24 * 60 * 60 * 1000;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function churnReasons(row: ScoredEstablishmentRow): string[] {
  const reasons: string[] = [];
  if (row.subscription_status === "PAST_DUE") reasons.push("Pagamento em atraso");
  if (row.subscription_status === "TRIALING") reasons.push("Trial sem conversão");
  if (!row.last_access) reasons.push("Sem login registrado");
  else if (row.last_access < new Date(Date.now() - 30 * DAY_MS)) {
    reasons.push("Login irregular");
  }
  return reasons;
}

async function planChurnRate(planId: string): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * DAY_MS);
  const [canceledRecently, liveAtCutoff] = await Promise.all([
    db.subscription.count({ where: { planId, canceledAt: { gte: cutoff } } }),
    db.subscription.count({
      where: {
        planId,
        createdAt: { lt: cutoff },
        OR: [{ canceledAt: null }, { canceledAt: { gte: cutoff } }],
      },
    }),
  ]);
  return liveAtCutoff > 0 ? (canceledRecently / liveAtCutoff) * 100 : 0;
}

export interface EstablishmentDetailExtras {
  ltv: number;
  services: number;
  products: number;
  campaigns: number;
  sessions: number;
  dau: number;
  wau: number;
  mau: number;
  activeDays: number;
  delinquency: boolean;
  delinquencyAmount: number;
  mrrAtRisk: number;
  churnReasons: string[];
}

/**
 * Extra aggregates for the admin establishment detail page.
 * All numbers come from real tables — never invented.
 */
export async function queryEstablishmentDetailExtras(
  id: string,
  scored: ScoredEstablishmentRow
): Promise<EstablishmentDetailExtras> {
  const now = Date.now();
  const oneDayAgo = new Date(now - DAY_MS);
  const sevenDaysAgo = new Date(now - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now - 30 * DAY_MS);

  const [services, products, campaigns, subscription, engagement] = await Promise.all([
    db.service.count({ where: { establishmentId: id } }),
    db.product.count({ where: { establishmentId: id } }),
    db.campaign.count({ where: { establishmentId: id } }),
    db.subscription.findUnique({
      where: { establishmentId: id },
      select: { planId: true, status: true },
    }),
    db.$queryRaw<
      {
        sessions: number;
        dau: number;
        wau: number;
        mau: number;
        active_days: number;
      }[]
    >(Prisma.sql`
      SELECT
        COUNT(*)::int AS sessions,
        COUNT(DISTINCT s."userId") FILTER (WHERE s."createdAt" >= ${oneDayAgo})::int AS dau,
        COUNT(DISTINCT s."userId") FILTER (WHERE s."createdAt" >= ${sevenDaysAgo})::int AS wau,
        COUNT(DISTINCT s."userId") FILTER (WHERE s."createdAt" >= ${thirtyDaysAgo})::int AS mau,
        COUNT(DISTINCT DATE(s."createdAt"))::int AS active_days
      FROM sessions s
      JOIN establishment_members em ON em."userId" = s."userId"
      WHERE em."establishmentId" = ${id}
        AND em.status = 'ACTIVE'
        AND s."createdAt" >= ${thirtyDaysAgo}
        AND s."revokedAt" IS NULL
    `),
  ]);

  const eng = engagement[0] ?? {
    sessions: 0,
    dau: 0,
    wau: 0,
    mau: 0,
    active_days: 0,
  };

  let ltv = 0;
  if (scored.mrr > 0 && subscription?.planId) {
    const churn = await planChurnRate(subscription.planId);
    ltv = churn > 0 ? round2(scored.mrr / (churn / 100)) : round2(scored.mrr * 12);
  }

  const delinquency = scored.subscription_status === "PAST_DUE";
  const delinquencyAmount = delinquency ? scored.mrr : 0;
  const mrrAtRisk =
    scored.churn_risk === "high" || scored.churn_risk === "medium" ? scored.mrr : 0;

  return {
    ltv,
    services,
    products,
    campaigns,
    sessions: Number(eng.sessions),
    dau: Number(eng.dau),
    wau: Number(eng.wau),
    mau: Number(eng.mau),
    activeDays: Number(eng.active_days),
    delinquency,
    delinquencyAmount: round2(delinquencyAmount),
    mrrAtRisk: round2(mrrAtRisk),
    churnReasons: churnReasons(scored),
  };
}
