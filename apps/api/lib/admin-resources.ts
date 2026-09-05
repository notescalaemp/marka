import { db, Prisma } from "@marka/db";
import type { BusinessRole, PaymentMethod, PaymentStatus, SubscriptionStatus, SupportTicketPriority, SupportTicketStatus, SupportTicketType, UserStatus } from "@marka/db";
import {
  getChurnRate,
  getGlobalMrr,
  getTrialToPaid,
} from "./admin-overview";
import {
  queryChurnRiskCounts,
  queryMrrAtRisk,
  queryScoredAtRiskList,
  type ScoredEstablishmentRow,
} from "./admin-establishments";
import { queryUtilizationByIds } from "./admin-utilization";

const DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * DAY_MS);

const ROLE_TYPE_LABEL: Record<BusinessRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  PROFESSIONAL: "Professional",
  STAFF: "Staff",
};

const ADMIN_ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  finance: "Finance",
  support: "Support",
  operations: "Operations",
  product: "Product",
  read_only: "Read Only",
};

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function formatBrl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatActivityLabel(lastLogin: Date | null): string {
  if (!lastLogin) return "—";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - DAY_MS);
  if (lastLogin >= startOfToday) return "Hoje";
  if (lastLogin >= startOfYesterday) return "Ontem";
  const days = Math.floor((startOfToday.getTime() - lastLogin.getTime()) / DAY_MS);
  return `${days}d`;
}

function periodStart(period: "7d" | "30d" | "90d"): Date {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  return new Date(Date.now() - days * DAY_MS);
}

function monthLabel(d: Date): string {
  return MONTH_LABELS[d.getMonth()] ?? "—";
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UsersListFilters {
  search?: string;
  type?: string;
  status?: UserStatus;
}

interface UserListRow {
  id: string;
  name: string;
  email: string;
  user_status: UserStatus;
  createdAt: Date;
  establishment_name: string | null;
  membership_role: BusinessRole | null;
  is_customer_only: boolean;
  last_login: Date | null;
}

const USERS_LIST_CTE = Prisma.sql`
  WITH ranked_memberships AS (
    SELECT
      em."userId",
      em.role,
      e.name AS establishment_name,
      ROW_NUMBER() OVER (
        PARTITION BY em."userId"
        ORDER BY CASE em.role
          WHEN 'OWNER' THEN 1
          WHEN 'ADMIN' THEN 2
          WHEN 'MANAGER' THEN 3
          WHEN 'PROFESSIONAL' THEN 4
          WHEN 'STAFF' THEN 5
        END
      ) AS rn
    FROM establishment_members em
    JOIN establishments e ON e.id = em."establishmentId"
    WHERE em.status = 'ACTIVE'
  ),
  primary_membership AS (
    SELECT "userId", role, establishment_name FROM ranked_memberships WHERE rn = 1
  ),
  customer_only AS (
    SELECT DISTINCT c."userId"
    FROM customers c
    WHERE c."userId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM establishment_members em
        WHERE em."userId" = c."userId" AND em.status = 'ACTIVE'
      )
  ),
  user_rows AS (
    SELECT
      u.id,
      u.name,
      u.email,
      u.status AS user_status,
      u."createdAt",
      pm.establishment_name,
      pm.role AS membership_role,
      (co."userId" IS NOT NULL) AS is_customer_only,
      (SELECT MAX(s."createdAt") FROM sessions s WHERE s."userId" = u.id) AS last_login
    FROM users u
    LEFT JOIN primary_membership pm ON pm."userId" = u.id
    LEFT JOIN customer_only co ON co."userId" = u.id
  )
`;

function usersWhereFragment(filters: UsersListFilters) {
  const search = filters.search ?? null;
  const status = filters.status ?? null;
  const type = filters.type ?? null;

  return Prisma.sql`
    WHERE (${status}::text IS NULL OR user_status::text = ${status})
      AND (
        ${type}::text IS NULL OR ${type} = 'all'
        OR (${type} = 'CUSTOMER' AND is_customer_only = true)
        OR (membership_role::text = ${type} AND is_customer_only = false)
      )
      AND (
        ${search}::text IS NULL
        OR name ILIKE '%' || ${search} || '%'
        OR email ILIKE '%' || ${search} || '%'
        OR establishment_name ILIKE '%' || ${search} || '%'
      )
  `;
}

function mapUserType(row: UserListRow): string {
  if (row.membership_role) return ROLE_TYPE_LABEL[row.membership_role];
  if (row.is_customer_only) return "Customer";
  return "Customer";
}

export async function queryUsersList(filters: UsersListFilters, skip: number, take: number) {
  const where = usersWhereFragment(filters);

  const [items, countRows] = await Promise.all([
    db.$queryRaw<UserListRow[]>(Prisma.sql`
      ${USERS_LIST_CTE}
      SELECT * FROM user_rows ${where}
      ORDER BY "createdAt" DESC
      LIMIT ${take} OFFSET ${skip}
    `),
    db.$queryRaw<{ count: number }[]>(Prisma.sql`
      ${USERS_LIST_CTE}
      SELECT COUNT(*)::int AS count FROM user_rows ${where}
    `),
  ]);

  return { items, total: countRows[0]?.count ?? 0 };
}

export async function getUsersKpis() {
  const oneDayAgo = new Date(Date.now() - DAY_MS);
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

  const [total, active, dauRows, wauRows] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "ACTIVE" } }),
    db.session.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: oneDayAgo } },
    }),
    db.session.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
  ]);

  return { total, active, dau: dauRows.length, wau: wauRows.length };
}

export function mapUserRow(row: UserListRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    establishment: row.establishment_name,
    type: mapUserType(row),
    status: row.user_status === "ACTIVE" ? "ativo" : "inativo",
    lastLogin: row.last_login ? row.last_login.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    activity: formatActivityLabel(row.last_login),
  };
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

async function getPlanChurnRate(planId: string): Promise<number> {
  const cutoff = THIRTY_DAYS_AGO();
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

export async function queryPlansList() {
  const plans = await db.plan.findMany({ orderBy: { priceMonthly: "desc" } });
  const grouped = await db.subscription.groupBy({
    by: ["planId", "status"],
    where: { status: { in: ["ACTIVE", "TRIALING"] } },
    _count: { _all: true },
  });

  const counts = new Map<string, { active: number; trial: number }>();
  for (const g of grouped) {
    const entry = counts.get(g.planId) ?? { active: 0, trial: 0 };
    if (g.status === "ACTIVE") entry.active = g._count._all;
    if (g.status === "TRIALING") entry.trial = g._count._all;
    counts.set(g.planId, entry);
  }

  const totalMrr = await getGlobalMrr();

  const items = await Promise.all(
    plans.map(async (plan) => {
      const { active: activeCount = 0, trial: trialCount = 0 } = counts.get(plan.id) ?? {};
      const subscribers = activeCount + trialCount;
      const price = Number(plan.priceMonthly);
      const mrr = activeCount * price;
      const revenueShare = totalMrr > 0 ? (mrr / totalMrr) * 100 : 0;
      const arpu = activeCount > 0 ? mrr / activeCount : 0;
      const churn = await getPlanChurnRate(plan.id);
      const trialToPaid = subscribers > 0 ? (activeCount / subscribers) * 100 : 0;

      return {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        priceMonthly: price,
        active: plan.active,
        subscribers,
        activeCount,
        trialCount,
        mrr,
        revenueShare,
        arpu,
        churn,
        upgradeRate: 0,
        downgradeRate: 0,
        trialToPaid,
        // Classic SaaS: ARPU / monthly churn. When churn is 0 (no cancels
        // observed), use a finite 12-month horizon instead of inventing ∞.
        ltv:
          arpu <= 0
            ? 0
            : churn > 0
              ? Math.round((arpu / (churn / 100)) * 100) / 100
              : Math.round(arpu * 12 * 100) / 100,
      };
    })
  );

  return items;
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export interface SubscriptionsListFilters {
  status?: SubscriptionStatus;
  plan?: string;
}

function mapSubscriptionStatus(status: SubscriptionStatus): string {
  const map: Record<SubscriptionStatus, string> = {
    ACTIVE: "active",
    TRIALING: "trial",
    PAST_DUE: "past_due",
    CANCELED: "canceled",
    INCOMPLETE: "paused",
  };
  return map[status];
}

export async function querySubscriptionsList(filters: SubscriptionsListFilters, skip: number, take: number) {
  const where: Prisma.SubscriptionWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.plan) {
    where.plan = {
      OR: [
        { code: { equals: filters.plan, mode: "insensitive" } },
        { name: { contains: filters.plan, mode: "insensitive" } },
      ],
    };
  }

  const [items, total] = await Promise.all([
    db.subscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        plan: { select: { name: true, priceMonthly: true } },
        establishment: {
          select: {
            name: true,
            members: {
              where: { role: "OWNER", status: "ACTIVE" },
              take: 1,
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    }),
    db.subscription.count({ where }),
  ]);

  return { items, total };
}

export async function getSubscriptionsKpis() {
  const [active, trial, pastDue] = await Promise.all([
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "TRIALING" } }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
  ]);
  return { active, trial, pastDue, expansionMrr: 0 };
}

export function mapSubscriptionRow(sub: Awaited<ReturnType<typeof querySubscriptionsList>>["items"][number]) {
  const ownerName = sub.establishment.members[0]?.user.name;
  const price = Number(sub.plan.priceMonthly);
  const mrr = sub.status === "ACTIVE" || sub.status === "PAST_DUE" ? price : 0;

  return {
    id: sub.id,
    customer: ownerName ?? sub.establishment.name,
    establishment: sub.establishment.name,
    plan: sub.plan.name,
    status: mapSubscriptionStatus(sub.status),
    mrr,
    createdAt: sub.createdAt.toISOString().slice(0, 10),
    nextBilling: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString().slice(0, 10) : "—",
  };
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export interface PaymentsListFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
}

function mapPaymentMethod(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    PIX: "PIX",
    CARD: "card",
    CASH: "cash",
    OTHER: "other",
  };
  return map[method];
}

function mapPaymentStatus(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PAID: "approved",
    PENDING: "pending",
    FAILED: "failed",
    REFUNDED: "refunded",
    CANCELED: "failed",
  };
  return map[status];
}

export async function queryPaymentsList(filters: PaymentsListFilters, skip: number, take: number) {
  const where: Prisma.PaymentWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.method) where.method = filters.method;

  const [items, total] = await Promise.all([
    db.payment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        establishment: { select: { name: true } },
      },
    }),
    db.payment.count({ where }),
  ]);

  return { items, total };
}

export async function getPaymentsKpis() {
  const [paidAgg, approved, failed] = await Promise.all([
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    db.payment.count({ where: { status: "PAID" } }),
    db.payment.count({ where: { status: { in: ["FAILED", "CANCELED"] } } }),
  ]);

  const volume = Number(paidAgg._sum.amount ?? 0);
  const failureRate = approved + failed > 0 ? (failed / (approved + failed)) * 100 : 0;

  return { volume, approved, failed, failureRate };
}

export function mapPaymentRow(payment: Awaited<ReturnType<typeof queryPaymentsList>>["items"][number]) {
  const date = payment.paidAt ?? payment.createdAt;
  return {
    id: payment.id,
    customer: payment.customer?.name ?? "—",
    establishment: payment.establishment.name,
    value: Number(payment.amount),
    method: mapPaymentMethod(payment.method),
    status: mapPaymentStatus(payment.status),
    date: date.toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export async function queryFinanceMetrics(period: "7d" | "30d" | "90d") {
  const since = periodStart(period);
  const mrr = await getGlobalMrr();
  const arr = mrr * 12;

  const [paidAgg, refundedAgg, pastDue, settings] = await Promise.all([
    db.payment.aggregate({
      where: { status: "PAID", createdAt: { gte: since } },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: { status: "REFUNDED", createdAt: { gte: since } },
      _sum: { amount: true },
    }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
    ensurePlatformSettings(),
  ]);

  const receita = Number(paidAgg._sum.amount ?? 0);
  const refunds = Number(refundedAgg._sum.amount ?? 0);
  const feePercent = Number(settings.paymentFeePercent);
  const taxas = Math.round(receita * (feePercent / 100) * 100) / 100;
  const receitaLiquida = Math.round((receita - taxas) * 100) / 100;
  const margin = receita > 0 ? Math.round(((receitaLiquida / receita) * 100) * 10) / 10 : 100;

  const metrics = [
    { label: "Receita", value: formatBrl(receita), delta: 0 },
    { label: "Receita líquida", value: formatBrl(receitaLiquida), delta: 0 },
    { label: "MRR", value: formatBrl(mrr), delta: 0 },
    { label: "ARR", value: formatBrl(arr), delta: 0 },
    { label: "Taxas", value: formatBrl(taxas), delta: 0 },
    { label: "Refunds", value: formatBrl(refunds), delta: 0 },
    { label: "Recorrente", value: formatBrl(mrr), delta: 0 },
    { label: "Margem", value: `${margin}%`, delta: 0 },
  ];

  return {
    metrics,
    breakdown: {
      recurring: mrr,
      nonRecurring: receita,
      delinquency: pastDue,
      margin,
    },
  };
}

// ---------------------------------------------------------------------------
// Customers (establishment CRM records)
// ---------------------------------------------------------------------------

export interface CustomersListFilters {
  search?: string;
  status?: string;
}

export async function queryCustomersList(filters: CustomersListFilters, skip: number, take: number) {
  const where: Prisma.CustomerWhereInput = {};
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { establishment: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        establishment: { select: { name: true } },
        _count: { select: { appointments: true, payments: { where: { status: "PAID" } } } },
      },
    }),
    db.customer.count({ where }),
  ]);

  const customerIds = customers.map((c) => c.id);
  const [paidSums, latestAppointments] = await Promise.all([
    customerIds.length
      ? db.payment.groupBy({
          by: ["customerId"],
          where: { customerId: { in: customerIds }, status: "PAID" },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    customerIds.length
      ? db.appointment.findMany({
          where: { customerId: { in: customerIds } },
          orderBy: { startAt: "desc" },
          distinct: ["customerId"],
          select: { customerId: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const paidByCustomer = new Map(paidSums.map((p) => [p.customerId, Number(p._sum.amount ?? 0)]));
  const latestStatus = new Map(latestAppointments.map((a) => [a.customerId, a.status]));

  const items = customers.map((c) => {
    const bookings = c._count.appointments;
    const totalPaid = paidByCustomer.get(c.id) ?? 0;
    const ticket = bookings > 0 ? totalPaid / bookings : 0;
    const repeat = bookings > 1 ? Math.round(((bookings - 1) / bookings) * 100) : 0;
    const latest = latestStatus.get(c.id);

    let status = "ativo";
    if (bookings === 0) status = "inativo";
    else if (latest === "CANCELADO") status = "cancelado";
    else if (latest === "NO_SHOW") status = "no-show";

    return {
      id: c.id,
      name: c.name,
      establishment: c.establishment.name,
      status,
      total: totalPaid,
      bookings,
      ticket: Math.round(ticket),
      repeat,
    };
  });

  const filtered =
    filters.status && filters.status !== "all"
      ? items.filter((i) => i.status === filters.status)
      : items;

  return { items: filtered, total: filters.status && filters.status !== "all" ? filtered.length : total };
}

export async function getCustomersKpis() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [total, newThisMonth, bookings, withBooking] = await Promise.all([
    db.customer.count(),
    db.customer.count({ where: { createdAt: { gte: monthStart } } }),
    db.appointment.count(),
    db.customer.count({ where: { appointments: { some: {} } } }),
  ]);
  // Share of customers who have at least one appointment.
  const bookingConversion =
    total > 0 ? Math.round((withBooking / total) * 1000) / 10 : 0;
  return { total, newThisMonth, bookings, bookingConversion };
}

// ---------------------------------------------------------------------------
// Churn risk
// ---------------------------------------------------------------------------

function churnRiskScore(risk: ScoredEstablishmentRow["churn_risk"]): number | null {
  if (risk === "high") return 80;
  if (risk === "medium") return 50;
  if (risk === "low") return 20;
  return null;
}

function buildChurnReasons(row: ScoredEstablishmentRow): string[] {
  const reasons: string[] = [];
  if (row.subscription_status === "PAST_DUE") reasons.push("Pagamento em atraso");
  if (row.subscription_status === "TRIALING") reasons.push("Trial sem conversão");
  if (!row.last_access) reasons.push("Sem login registrado");
  else if (row.last_access < THIRTY_DAYS_AGO()) reasons.push("Login irregular");
  return reasons;
}

export async function queryChurnRiskList(skip: number, take: number) {
  const { items, total } = await queryScoredAtRiskList(skip, take);
  const utilization = await queryUtilizationByIds(items.map((r) => r.id));

  const mapped = items.map((row) => {
    const util = utilization.get(row.id) ?? { utilization: 0, utilizationDelta: 0 };
    return {
      id: row.id,
      establishment: row.name,
      plan: row.plan_name ?? "—",
      mrr: row.mrr,
      riskScore: churnRiskScore(row.churn_risk) ?? 0,
      lastLogin: row.last_access ? row.last_access.toISOString() : null,
      utilization: util.utilization,
      utilizationDelta: util.utilizationDelta,
      reasons: buildChurnReasons(row),
    };
  });

  return { items: mapped, total };
}

export async function getChurnRiskKpis() {
  return queryChurnRiskCounts();
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export interface AdminAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "opportunity";
  title: string;
  description: string;
  cta: string;
}

export async function queryAlerts(): Promise<AdminAlert[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
  const alerts: AdminAlert[] = [];

  const [recentPayments, pastDue, newEstablishments] = await Promise.all([
    db.payment.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { in: ["PAID", "FAILED", "CANCELED"] } },
      select: { status: true },
    }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
    db.establishment.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const approved = recentPayments.filter((p) => p.status === "PAID").length;
  const failed = recentPayments.filter((p) => p.status !== "PAID").length;
  const failureRate = approved + failed > 0 ? (failed / (approved + failed)) * 100 : 0;

  if (failureRate > 5) {
    alerts.push({
      id: "alert-payment-failure",
      severity: "critical",
      title: "Taxa de pagamentos falhos aumentou significativamente.",
      description: `Failure rate em ${failureRate.toFixed(1)}% nos últimos 7 dias.`,
      cta: "Ver payments",
    });
  }

  if (pastDue > 0) {
    alerts.push({
      id: "alert-past-due",
      severity: "warning",
      title: "Assinaturas com pagamento em atraso.",
      description: `${pastDue} assinatura(s) com status past due.`,
      cta: "Ver subscriptions",
    });
  }

  if (newEstablishments > 0) {
    alerts.push({
      id: "alert-new-establishments",
      severity: "info",
      title: "Novos estabelecimentos cadastrados.",
      description: `${newEstablishments} estabelecimento(s) criado(s) nos últimos 7 dias.`,
      cta: "Ver establishments",
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Administrators
// ---------------------------------------------------------------------------

export async function queryAdministratorsList() {
  const admins = await db.administrator.findMany({ orderBy: { createdAt: "asc" } });
  const adminIds = admins.map((a) => a.id);
  const thirtyDaysAgo = THIRTY_DAYS_AGO();

  const [lastLogins, actionCounts] = await Promise.all([
    adminIds.length
      ? db.adminSession.groupBy({
          by: ["administratorId"],
          where: { administratorId: { in: adminIds } },
          _max: { createdAt: true },
        })
      : Promise.resolve([]),
    adminIds.length
      ? db.auditLog.groupBy({
          by: ["actorId"],
          where: {
            actorType: "ADMINISTRATOR",
            actorId: { in: adminIds },
            createdAt: { gte: thirtyDaysAgo },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const loginMap = new Map(lastLogins.map((l) => [l.administratorId, l._max.createdAt]));
  const actionMap = new Map(actionCounts.map((a) => [a.actorId, a._count._all]));

  return admins.map((admin) => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: ADMIN_ROLE_LABEL[admin.role] ?? admin.role,
    status: admin.status === "ACTIVE" ? "ativo" : "inativo",
    lastLogin: loginMap.get(admin.id)?.toISOString() ?? null,
    recentActions: actionMap.get(admin.id) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export interface AuditLogsFilters {
  action?: string;
  admin?: string;
}

export async function queryAuditLogsList(filters: AuditLogsFilters, skip: number, take: number) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.action) where.action = { contains: filters.action, mode: "insensitive" };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { establishment: { select: { name: true } } },
    }),
    db.auditLog.count({ where }),
  ]);

  const adminIds = [...new Set(logs.filter((l) => l.actorType === "ADMINISTRATOR" && l.actorId).map((l) => l.actorId!))];
  const admins =
    adminIds.length > 0
      ? await db.administrator.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, name: true },
        })
      : [];
  const adminMap = new Map(admins.map((a) => [a.id, a.name]));

  let items = logs.map((log) => {
    const adminName =
      log.actorType === "ADMINISTRATOR" && log.actorId
        ? (adminMap.get(log.actorId) ?? "System")
        : "System";
    const entity =
      log.establishment?.name ??
      (log.targetType && log.targetId ? `${log.targetType}/${log.targetId}` : "—");

    return {
      id: log.id,
      at: log.createdAt.toISOString(),
      admin: adminName,
      action: log.action,
      entity,
      result: "sucesso",
      ip: log.ip ?? "—",
    };
  });

  if (filters.admin) {
    const q = filters.admin.toLowerCase();
    items = items.filter((i) => i.admin.toLowerCase().includes(q));
  }

  return { items, total: filters.admin ? items.length : total };
}

// ---------------------------------------------------------------------------
// Analytics — acquisition
// ---------------------------------------------------------------------------

const CHANNEL_LABELS: Record<string, string> = {
  organic: "Orgânico",
  paid: "Pago",
  referral: "Indicação",
  partner: "Parceiro",
  other: "Outro",
};

export async function queryAcquisitionAnalytics(period?: "7d" | "30d" | "90d") {
  const since = period ? periodStart(period) : undefined;
  const estWhere = since ? { createdAt: { gte: since } } : {};
  const userWhere = since ? { createdAt: { gte: since } } : {};

  const [leads, signups, trialing, activePaid, trialToPaid, settings, channelGroups] =
    await Promise.all([
      db.establishment.count({ where: estWhere }),
      db.user.count({ where: userWhere }),
      db.subscription.count({ where: { status: "TRIALING" } }),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      getTrialToPaid(),
      ensurePlatformSettings(),
      db.establishment.groupBy({
        by: ["acquisitionChannel"],
        where: estWhere,
        _count: { _all: true },
      }),
    ]);

  const spend = Number(settings.marketingSpendMonthly);
  // CAC = monthly marketing spend / new establishments in the window.
  const cac = leads > 0 ? Math.round((spend / leads) * 100) / 100 : 0;

  const channels =
    leads > 0
      ? channelGroups
          .map((g) => ({
            label: CHANNEL_LABELS[g.acquisitionChannel] ?? g.acquisitionChannel,
            value: Math.round((g._count._all / leads) * 1000) / 10,
          }))
          .sort((a, b) => b.value - a.value)
      : [];

  return {
    leads,
    signups,
    trialToPaid,
    cac,
    funnel: [
      { label: "Estabelecimentos criados", value: leads },
      { label: "Trials (TRIALING)", value: trialing },
      { label: "Active paid (ACTIVE)", value: activePaid },
    ],
    channels,
  };
}

// ---------------------------------------------------------------------------
// Analytics — retention
// ---------------------------------------------------------------------------

export async function queryRetentionCohorts() {
  const now = new Date();
  const cohortStarts: Date[] = [];
  for (let i = 5; i >= 0; i--) {
    cohortStarts.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }

  const cohorts = await Promise.all(
    cohortStarts.map(async (cohortStart) => {
      const cohortEnd = new Date(cohortStart.getFullYear(), cohortStart.getMonth() + 1, 1);
      const subs = await db.subscription.findMany({
        where: { createdAt: { gte: cohortStart, lt: cohortEnd } },
        select: { id: true, createdAt: true, canceledAt: true, status: true },
      });
      const cohortSize = subs.length;

      const retentionAtOffset = (offsetMonths: number): number | null => {
        const checkEnd = new Date(cohortStart.getFullYear(), cohortStart.getMonth() + offsetMonths + 1, 1);
        if (checkEnd > now) return null;
        if (cohortSize === 0) return 0;
        const stillActive = subs.filter(
          (s) => !s.canceledAt || s.canceledAt >= checkEnd
        ).length;
        return Math.round((stillActive / cohortSize) * 100);
      };

      return {
        month: monthLabel(cohortStart),
        m1: retentionAtOffset(1),
        m2: retentionAtOffset(2),
        m3: retentionAtOffset(3),
        m4: retentionAtOffset(4),
        m5: retentionAtOffset(5),
        m6: retentionAtOffset(6),
      };
    })
  );

  return cohorts;
}

// ---------------------------------------------------------------------------
// Analytics — product usage
// ---------------------------------------------------------------------------

export async function queryProductUsageAnalytics() {
  const oneDayAgo = new Date(Date.now() - DAY_MS);
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

  const [dauRows, wauRows, sessionsLast7d, totalEstablishments] = await Promise.all([
    db.session.groupBy({ by: ["userId"], where: { createdAt: { gte: oneDayAgo } } }),
    db.session.groupBy({ by: ["userId"], where: { createdAt: { gte: sevenDaysAgo } } }),
    db.session.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.establishment.count(),
  ]);

  const dau = dauRows.length;
  const wau = wauRows.length;
  const stickiness = wau > 0 ? (dau / wau) * 100 : 0;
  const sessionsPerUser = wau > 0 ? sessionsLast7d / wau : 0;

  const adoption = async (countFn: () => Promise<number>, label: string) => {
    const withFeature = await countFn();
    const pct = totalEstablishments > 0 ? Math.round((withFeature / totalEstablishments) * 100) : 0;
    return { feature: label, adoption: pct, growth: 0 };
  };

  const features = await Promise.all([
    adoption(
      () => db.establishment.count({ where: { appointments: { some: {} } } }),
      "Appointments"
    ),
    adoption(
      () => db.establishment.count({ where: { customers: { some: {} } } }),
      "Customers"
    ),
    adoption(
      () => db.establishment.count({ where: { professionals: { some: {} } } }),
      "Professionals"
    ),
    adoption(
      () => db.establishment.count({ where: { campaigns: { some: {} } } }),
      "Campaigns"
    ),
    adoption(
      () => db.establishment.count({ where: { payments: { some: {} } } }),
      "Payments"
    ),
  ]);

  return {
    kpis: { dau, wau, stickiness, sessionsPerUser },
    features,
  };
}

// ---------------------------------------------------------------------------
// Analytics — churn
// ---------------------------------------------------------------------------

export async function queryChurnAnalytics() {
  const cutoff = THIRTY_DAYS_AGO();
  const [customerChurn, mrr, mrrAtRisk, canceledCount, pastDueCount, trialingCount] = await Promise.all([
    getChurnRate(),
    getGlobalMrr(),
    queryMrrAtRisk(),
    db.subscription.count({ where: { canceledAt: { gte: cutoff } } }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
    db.subscription.count({ where: { status: "TRIALING" } }),
  ]);

  const lostSubs = await db.subscription.findMany({
    where: { canceledAt: { gte: cutoff } },
    select: { plan: { select: { priceMonthly: true } } },
  });
  const lostMrr = lostSubs.reduce((sum, s) => sum + Number(s.plan.priceMonthly), 0);
  const revenueChurn = mrr > 0 ? (lostMrr / mrr) * 100 : 0;

  const totalReasons = canceledCount + pastDueCount + trialingCount;
  const breakdown = [
    { reason: "Cancelamento", share: totalReasons > 0 ? Math.round((canceledCount / totalReasons) * 100) : 0 },
    { reason: "Inadimplência (PAST_DUE)", share: totalReasons > 0 ? Math.round((pastDueCount / totalReasons) * 100) : 0 },
    { reason: "Trial ativo", share: totalReasons > 0 ? Math.round((trialingCount / totalReasons) * 100) : 0 },
  ];

  return {
    kpis: {
      customerChurn,
      revenueChurn,
      // Gross Retention ≈ 100 − revenue churn. With no expansion/upsell tracked,
      // Net Retention equals GRR (expansion = 0 ⇒ NRR = GRR).
      grr: Math.max(0, Math.round((100 - revenueChurn) * 10) / 10),
      nrr: Math.max(0, Math.round((100 - revenueChurn) * 10) / 10),
    },
    breakdown,
    mrrAtRisk,
  };
}

// ---------------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------------

export interface SupportTicketsListFilters {
  search?: string;
  type?: SupportTicketType | "all";
  status?: SupportTicketStatus | "all";
  priority?: SupportTicketPriority | "all";
}

function mapSupportTicket(t: {
  id: string;
  subject: string;
  customerName: string;
  type: SupportTicketType;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: Date;
  establishment: { name: string } | null;
}) {
  return {
    id: t.id,
    subject: t.subject,
    customer: t.customerName,
    establishment: t.establishment?.name ?? "—",
    type: t.type,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function querySupportTickets(filters: SupportTicketsListFilters = {}) {
  const where: Prisma.SupportTicketWhereInput = {};
  if (filters.type && filters.type !== "all") where.type = filters.type;
  if (filters.status && filters.status !== "all") where.status = filters.status;
  if (filters.priority && filters.priority !== "all") where.priority = filters.priority;
  if (filters.search) {
    where.OR = [
      { subject: { contains: filters.search, mode: "insensitive" } },
      { customerName: { contains: filters.search, mode: "insensitive" } },
      { establishment: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [tickets, open, highPriority, resolved] = await Promise.all([
    db.supportTicket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { establishment: { select: { name: true } } },
      take: 200,
    }),
    db.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    db.supportTicket.count({ where: { priority: "high", status: { in: ["open", "in_progress"] } } }),
    db.supportTicket.count({ where: { status: "resolved" } }),
  ]);

  return {
    kpis: {
      open,
      highPriority,
      resolved,
      openOnly: open,
    },
    items: tickets.map(mapSupportTicket),
  };
}

export async function createSupportTicket(input: {
  subject: string;
  description?: string;
  type: SupportTicketType;
  priority: SupportTicketPriority;
  customerName: string;
  establishmentId?: string;
  createdById: string;
}) {
  const ticket = await db.supportTicket.create({
    data: {
      subject: input.subject,
      description: input.description,
      type: input.type,
      priority: input.priority,
      customerName: input.customerName,
      establishmentId: input.establishmentId,
      createdById: input.createdById,
      status: "open",
    },
    include: { establishment: { select: { name: true } } },
  });
  return mapSupportTicket(ticket);
}

export async function updateSupportTicket(
  id: string,
  input: { status?: SupportTicketStatus; priority?: SupportTicketPriority; assigneeId?: string | null }
) {
  const existing = await db.supportTicket.findUnique({ where: { id } });
  if (!existing) return null;

  const ticket = await db.supportTicket.update({
    where: { id },
    data: {
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId === undefined ? undefined : input.assigneeId,
      resolvedAt:
        input.status === undefined
          ? undefined
          : input.status === "resolved"
            ? new Date()
            : null,
    },
    include: { establishment: { select: { name: true } } },
  });
  return mapSupportTicket(ticket);
}

// ---------------------------------------------------------------------------
// Settings (persisted singleton)
// ---------------------------------------------------------------------------

const DEFAULT_FEATURES = {
  impersonation: true,
  auditLogs: true,
  marketingCampaigns: true,
  onlinePayments: false,
};

type SettingsFeatures = typeof DEFAULT_FEATURES;

function parseFeatures(value: unknown): SettingsFeatures {
  if (!value || typeof value !== "object") return { ...DEFAULT_FEATURES };
  const v = value as Record<string, unknown>;
  return {
    impersonation: Boolean(v.impersonation ?? DEFAULT_FEATURES.impersonation),
    auditLogs: Boolean(v.auditLogs ?? DEFAULT_FEATURES.auditLogs),
    marketingCampaigns: Boolean(v.marketingCampaigns ?? DEFAULT_FEATURES.marketingCampaigns),
    onlinePayments: Boolean(v.onlinePayments ?? DEFAULT_FEATURES.onlinePayments),
  };
}

async function ensurePlatformSettings() {
  const existing = await db.platformSettings.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return db.platformSettings.create({
    data: {
      id: "default",
      brandName: "marka.ia",
      locale: "pt-BR",
      features: DEFAULT_FEATURES,
      marketingSpendMonthly: 0,
      paymentFeePercent: 0,
      note: "",
    },
  });
}

function mapSettingsRow(row: {
  brandName: string;
  locale: string;
  features: unknown;
  marketingSpendMonthly: { toString(): string } | number;
  paymentFeePercent: { toString(): string } | number;
  note: string;
}) {
  return {
    brand: { name: row.brandName, locale: row.locale },
    environment: process.env.NODE_ENV ?? "development",
    apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
    cookieDomain: process.env.COOKIE_DOMAIN ?? "",
    features: parseFeatures(row.features),
    marketingSpendMonthly: Number(row.marketingSpendMonthly),
    paymentFeePercent: Number(row.paymentFeePercent),
    note: row.note ?? "",
  };
}

export async function querySettings() {
  const row = await ensurePlatformSettings();
  return mapSettingsRow(row);
}

export async function updateSettings(
  input: {
    brandName?: string;
    locale?: string;
    features?: Partial<SettingsFeatures>;
    marketingSpendMonthly?: number;
    paymentFeePercent?: number;
    note?: string;
  },
  updatedById: string
) {
  const current = await ensurePlatformSettings();
  const features = {
    ...parseFeatures(current.features),
    ...(input.features ?? {}),
  };
  const row = await db.platformSettings.update({
    where: { id: "default" },
    data: {
      brandName: input.brandName?.trim() || current.brandName,
      locale: input.locale?.trim() || current.locale,
      features,
      marketingSpendMonthly:
        input.marketingSpendMonthly !== undefined
          ? input.marketingSpendMonthly
          : current.marketingSpendMonthly,
      paymentFeePercent:
        input.paymentFeePercent !== undefined
          ? input.paymentFeePercent
          : current.paymentFeePercent,
      note: input.note !== undefined ? input.note : current.note,
      updatedById,
    },
  });
  return mapSettingsRow(row);
}
