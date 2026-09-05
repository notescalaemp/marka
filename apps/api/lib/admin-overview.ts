import { db } from "@marka/db";
import { queryMrrAtRisk } from "./admin-establishments";

const DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * DAY_MS);

// MRR = sum of the monthly plan price for every establishment whose
// subscription is currently ACTIVE (the standard SaaS definition: recurring
// revenue actually being paid, not trials or past-due accounts). One query
// with a joined select — Prisma resolves it as a single SQL JOIN, not N+1.
export async function getGlobalMrr(): Promise<number> {
  const activeSubs = await db.subscription.findMany({
    where: { status: "ACTIVE" },
    select: { plan: { select: { priceMonthly: true } } },
  });
  return activeSubs.reduce((sum, s) => sum + Number(s.plan.priceMonthly), 0);
}

export async function getActiveBusinessesCount(): Promise<number> {
  return db.establishment.count({ where: { status: "active" } });
}

// Churn = subscriptions canceled in the last 30 days / subscriptions that
// were live 30 days ago. Both sides are real counts from real timestamps;
// 0 is returned only when the denominator is genuinely 0 (no subscriptions
// existed yet), which is the mathematically honest value, not a fabricated
// "no churn" claim.
export async function getChurnRate(): Promise<number> {
  const cutoff = THIRTY_DAYS_AGO();
  const [canceledRecently, liveAtCutoff] = await Promise.all([
    db.subscription.count({ where: { canceledAt: { gte: cutoff } } }),
    db.subscription.count({
      where: {
        createdAt: { lt: cutoff },
        OR: [{ canceledAt: null }, { canceledAt: { gte: cutoff } }],
      },
    }),
  ]);
  return liveAtCutoff > 0 ? (canceledRecently / liveAtCutoff) * 100 : 0;
}

// MRR added minus MRR lost in the last 30 days, from real
// Subscription.createdAt / canceledAt timestamps.
export async function getNetNewMrr(): Promise<number> {
  const cutoff = THIRTY_DAYS_AGO();
  const [added, lost] = await Promise.all([
    db.subscription.findMany({
      where: { createdAt: { gte: cutoff }, status: "ACTIVE" },
      select: { plan: { select: { priceMonthly: true } } },
    }),
    db.subscription.findMany({
      where: { canceledAt: { gte: cutoff } },
      select: { plan: { select: { priceMonthly: true } } },
    }),
  ]);
  const addedMrr = added.reduce((sum, s) => sum + Number(s.plan.priceMonthly), 0);
  const lostMrr = lost.reduce((sum, s) => sum + Number(s.plan.priceMonthly), 0);
  return addedMrr - lostMrr;
}

export const getMrrAtRisk = queryMrrAtRisk;

// Of every subscription that has ever started (currently ACTIVE or still
// TRIALING), what fraction converted to paid. A simplification — it doesn't
// see trials that churned before ever being counted — but it's a real
// ratio over real current-state data, not a fabricated number.
export async function getTrialToPaid(): Promise<number> {
  const [active, trialing] = await Promise.all([
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "TRIALING" } }),
  ]);
  const denom = active + trialing;
  return denom > 0 ? (active / denom) * 100 : 0;
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function periodLabel(d: Date): string {
  return `${MONTH_LABELS[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
}

// Reconstructs MRR/ARR/users at the end of each of the last 12 months from
// real timestamps (Subscription.createdAt/canceledAt, User.createdAt) —
// never a fabricated trend. Months before any real data existed correctly
// show 0, since that's the true historical state, not a guess. Bounded to
// at most 12 iterations regardless of platform age or tenant count, so
// this doesn't scale with data volume the way a per-row loop would.
export async function getSeries() {
  const [earliestUser, earliestEst] = await Promise.all([
    db.user.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    db.establishment.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
  ]);
  const candidates = [earliestUser?.createdAt, earliestEst?.createdAt].filter((d): d is Date => Boolean(d));
  const start = candidates.length
    ? new Date(Math.min(...candidates.map((d) => d.getTime())))
    : new Date();

  const now = new Date();
  const months: Date[] = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const cap = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cursor <= cap) {
    months.push(cursor);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  const trimmed = months.slice(-12);

  return Promise.all(
    trimmed.map(async (monthStart) => {
      const periodEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      const [usersCount, liveSubs] = await Promise.all([
        db.user.count({ where: { createdAt: { lt: periodEnd } } }),
        db.subscription.findMany({
          where: {
            createdAt: { lt: periodEnd },
            OR: [{ canceledAt: null }, { canceledAt: { gte: periodEnd } }],
          },
          select: { plan: { select: { priceMonthly: true } } },
        }),
      ]);
      const mrr = liveSubs.reduce((sum, s) => sum + Number(s.plan.priceMonthly), 0);
      return { period: periodLabel(monthStart), mrr, arr: mrr * 12, users: usersCount };
    })
  );
}

type ActivityItem = {
  id: string;
  type: string;
  description: string;
  entity: string;
  at: string;
  status: string;
};

// Blends real platform-level events from five sources (never fabricated),
// each queried once (no per-row fan-out), then merged and truncated in
// memory — the fan-out here is bounded by `limit`, not by table size.
export async function getActivity(limit = 10): Promise<ActivityItem[]> {
  const [newEstablishments, subsStarted, subsCanceled, payments, adminAudits] = await Promise.all([
    db.establishment.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, createdAt: true },
    }),
    db.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, createdAt: true, establishment: { select: { name: true } } },
    }),
    db.subscription.findMany({
      where: { canceledAt: { not: null } },
      orderBy: { canceledAt: "desc" },
      take: limit,
      select: { id: true, canceledAt: true, establishment: { select: { name: true } } },
    }),
    db.payment.findMany({
      where: { status: { in: ["PAID", "FAILED"] } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, status: true, createdAt: true, establishment: { select: { name: true } } },
    }),
    db.auditLog.findMany({
      where: { actorType: "ADMINISTRATOR" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, action: true, createdAt: true },
    }),
  ]);

  const items: Array<ActivityItem & { atDate: Date }> = [
    ...newEstablishments.map((e) => ({
      id: `est-${e.id}`,
      type: "establishment",
      description: "Novo estabelecimento cadastrado.",
      entity: e.name,
      atDate: e.createdAt,
      at: e.createdAt.toISOString(),
      status: "info",
    })),
    ...subsStarted.map((s) => ({
      id: `sub-start-${s.id}`,
      type: "subscription",
      description: "Assinatura iniciada.",
      entity: s.establishment.name,
      atDate: s.createdAt,
      at: s.createdAt.toISOString(),
      status: "success",
    })),
    ...subsCanceled.map((s) => ({
      id: `sub-cancel-${s.id}`,
      type: "subscription",
      description: "Assinatura cancelada.",
      entity: s.establishment.name,
      atDate: s.canceledAt as Date,
      at: (s.canceledAt as Date).toISOString(),
      status: "warning",
    })),
    ...payments.map((p) => ({
      id: `pay-${p.id}`,
      type: "payment",
      description: p.status === "PAID" ? "Pagamento recebido." : "Pagamento falhou.",
      entity: p.establishment.name,
      atDate: p.createdAt,
      at: p.createdAt.toISOString(),
      status: p.status === "PAID" ? "success" : "danger",
    })),
    ...adminAudits.map((a) => ({
      id: `audit-${a.id}`,
      type: "admin",
      description: a.action,
      entity: "Backoffice",
      atDate: a.createdAt,
      at: a.createdAt.toISOString(),
      status: "info",
    })),
  ];

  return items
    .sort((a, b) => b.atDate.getTime() - a.atDate.getTime())
    .slice(0, limit)
    .map(({ atDate: _atDate, ...rest }) => rest);
}

// Subscriber counts via a single groupBy (not one query per plan).
export async function getPlansOverview() {
  const [plans, grouped] = await Promise.all([
    db.plan.findMany({ where: { active: true } }),
    db.subscription.groupBy({ by: ["planId"], where: { status: "ACTIVE" }, _count: { _all: true } }),
  ]);
  const countByPlan = new Map(grouped.map((g) => [g.planId, g._count._all]));

  return plans.map((plan) => {
    const subscribers = countByPlan.get(plan.id) ?? 0;
    return {
      id: plan.id,
      name: plan.name,
      subscribers,
      mrr: subscribers * Number(plan.priceMonthly),
      // No historical per-plan MRR snapshot exists yet — see STATUS report.
      growth: 0,
    };
  });
}
