import { db, Prisma } from "@marka/db";

// Global (platform-wide) establishment view for the Backoffice — never
// tenant-scoped. Raw SQL is used deliberately here: filtering/pagination
// need to happen on computed columns (mrr, churn_risk, last_access) that
// span several tables, and doing that with Prisma's query builder would
// mean loading every establishment into memory to filter in JS — exactly
// what this endpoint must not do. Every interpolated value below goes
// through Prisma's tagged-template parameterization (never string
// concatenation), so this is not SQL-injectable.
//
// churn_risk rule (deterministic, no fabricated scoring):
//   - no subscription, or subscription canceled -> not applicable (null)
//   - subscription past due                     -> "high"
//   - no member of the establishment has ever logged in -> "high"
//   - most recent member login older than 30 days       -> "medium"
//   - otherwise                                          -> "low"
// last_access = the most recent Session.createdAt among the establishment's
// members (Session only tracks per-User logins, not a per-establishment
// context, so this is the closest real proxy available in the schema).
const SCORED_CTE = Prisma.sql`
  WITH base AS (
    SELECT
      e.id,
      e.name,
      e.slug,
      e.category,
      e."createdAt",
      e.status AS establishment_status,
      owner_user.id AS owner_id,
      owner_user.name AS owner_name,
      owner_user.email AS owner_email,
      p.code AS plan_code,
      p.name AS plan_name,
      sub.status AS subscription_status,
      sub."currentPeriodEnd" AS current_period_end,
      sub."canceledAt" AS subscription_canceled_at,
      CASE WHEN sub.status = 'ACTIVE' THEN p."priceMonthly" ELSE 0 END::float8 AS mrr,
      (SELECT COUNT(*)::int FROM professionals pr WHERE pr."establishmentId" = e.id) AS professionals_count,
      (SELECT COUNT(*)::int FROM customers c WHERE c."establishmentId" = e.id) AS customers_count,
      (SELECT COUNT(*)::int FROM establishment_members m WHERE m."establishmentId" = e.id AND m.status = 'ACTIVE') AS members_count,
      (
        SELECT MAX(sess."createdAt")
        FROM sessions sess
        JOIN establishment_members em2 ON em2."userId" = sess."userId"
        WHERE em2."establishmentId" = e.id
      ) AS last_access
    FROM establishments e
    JOIN establishment_members em ON em."establishmentId" = e.id AND em.role = 'OWNER'
    JOIN users owner_user ON owner_user.id = em."userId"
    LEFT JOIN subscriptions sub ON sub."establishmentId" = e.id
    LEFT JOIN plans p ON p.id = sub."planId"
  ),
  scored AS (
    SELECT *,
      CASE
        WHEN subscription_status IS NULL OR subscription_status = 'CANCELED' THEN NULL
        WHEN subscription_status = 'PAST_DUE' THEN 'high'
        WHEN last_access IS NULL THEN 'high'
        WHEN last_access < NOW() - INTERVAL '30 days' THEN 'medium'
        ELSE 'low'
      END AS churn_risk
    FROM base
  )
`;

export interface ScoredEstablishmentRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  createdAt: Date;
  establishment_status: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  plan_code: string | null;
  plan_name: string | null;
  subscription_status: string | null;
  current_period_end: Date | null;
  subscription_canceled_at: Date | null;
  mrr: number;
  professionals_count: number;
  customers_count: number;
  members_count: number;
  last_access: Date | null;
  churn_risk: "low" | "medium" | "high" | null;
}

export interface EstablishmentListFilters {
  search?: string;
  status?: string;
  plan?: string;
  risk?: string;
}

function whereFragment(filters: EstablishmentListFilters) {
  const search = filters.search ?? null;
  const status = filters.status ?? null;
  const plan = filters.plan ?? null;
  const risk = filters.risk ?? null;

  return Prisma.sql`
    WHERE (${status}::text IS NULL OR establishment_status::text = ${status})
      AND (${plan}::text IS NULL OR plan_code = ${plan})
      AND (${risk}::text IS NULL OR churn_risk = ${risk})
      AND (
        ${search}::text IS NULL
        OR name ILIKE '%' || ${search} || '%'
        OR owner_email ILIKE '%' || ${search} || '%'
      )
  `;
}

export async function queryEstablishmentsList(
  filters: EstablishmentListFilters,
  skip: number,
  take: number
): Promise<{ items: ScoredEstablishmentRow[]; total: number }> {
  const where = whereFragment(filters);

  const [items, countRows] = await Promise.all([
    db.$queryRaw<ScoredEstablishmentRow[]>(Prisma.sql`
      ${SCORED_CTE}
      SELECT * FROM scored ${where}
      ORDER BY "createdAt" DESC
      LIMIT ${take} OFFSET ${skip}
    `),
    db.$queryRaw<{ count: number }[]>(Prisma.sql`
      ${SCORED_CTE}
      SELECT COUNT(*)::int AS count FROM scored ${where}
    `),
  ]);

  return { items, total: countRows[0]?.count ?? 0 };
}

export async function queryEstablishmentScored(id: string): Promise<ScoredEstablishmentRow | null> {
  const rows = await db.$queryRaw<ScoredEstablishmentRow[]>(Prisma.sql`
    ${SCORED_CTE}
    SELECT * FROM scored WHERE id = ${id}
  `);
  return rows[0] ?? null;
}

export async function queryMrrAtRisk(): Promise<number> {
  const rows = await db.$queryRaw<{ total: number }[]>(Prisma.sql`
    ${SCORED_CTE}
    SELECT COALESCE(SUM(mrr), 0)::float8 AS total FROM scored WHERE churn_risk IN ('high', 'medium')
  `);
  return rows[0]?.total ?? 0;
}
