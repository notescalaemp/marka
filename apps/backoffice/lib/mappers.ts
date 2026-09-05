import { formatDate, formatDateTime, formatNumber, formatPrice } from "./format";
import type {
  AdminEstablishmentDetailDto,
  AdminEstablishmentListItemDto,
  AdminOverviewDto,
  EstablishmentDetailView,
  EstablishmentListItemView,
  OverviewActivityView,
  OverviewKpiView,
  OverviewPlanView,
  OverviewSecondaryView,
} from "./api-types";

function trendFromDelta(delta: number): "up" | "down" | "flat" {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function formatChurn(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function mapOverviewKpis(dto: AdminOverviewDto): OverviewKpiView[] {
  const { kpis } = dto;
  return [
    {
      label: "MRR",
      value: formatPrice(kpis.mrr),
      delta: kpis.delta.mrr,
      trend: trendFromDelta(kpis.delta.mrr),
      context: "vs. 30 dias",
    },
    {
      label: "ARR",
      value: formatPrice(kpis.arr),
      delta: kpis.delta.arr,
      trend: trendFromDelta(kpis.delta.arr),
      context: "vs. 30 dias",
    },
    {
      label: "Active Businesses",
      value: formatNumber(kpis.activeBusinesses),
      delta: 0,
      trend: "flat",
      context: "atual",
    },
    {
      label: "Churn",
      value: formatChurn(kpis.churn),
      delta: 0,
      trend: "flat",
      context: "últimos 30 dias",
    },
  ];
}

export function mapOverviewSecondary(
  dto: AdminOverviewDto
): OverviewSecondaryView[] {
  const secondary = dto.secondary[0];
  if (!secondary) return [];

  return [
    {
      label: "Net New MRR",
      value: formatPrice(secondary.netNewMrr),
    },
    {
      label: "MRR at Risk",
      value: formatPrice(secondary.mrrAtRisk),
    },
    {
      label: "Trial → Paid",
      value: `${secondary.trialToPaid.toFixed(1).replace(".", ",")}%`,
    },
  ];
}

export function mapOverviewActivity(
  dto: AdminOverviewDto
): OverviewActivityView[] {
  return dto.activity.map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    entity: a.entity,
    at: formatDateTime(a.at),
    status: a.status,
  }));
}

export function mapOverviewPlans(dto: AdminOverviewDto): OverviewPlanView[] {
  return dto.plans.map((p) => ({
    id: p.id,
    name: p.name,
    subscribers: p.subscribers,
    mrr: p.mrr,
    growth: p.growth,
  }));
}

export function mapEstablishmentListItem(
  dto: AdminEstablishmentListItemDto
): EstablishmentListItemView {
  return {
    id: dto.id,
    name: dto.name,
    ownerName: dto.owner?.name ?? "—",
    ownerEmail: dto.owner?.email ?? "—",
    plan: dto.plan ?? "—",
    status: dto.status,
    mrr: dto.mrr,
    createdAt: formatDate(dto.createdAt),
    lastAccess: dto.lastAccess ? formatDateTime(dto.lastAccess) : "—",
    professionals: dto.professionals,
    customers: dto.customers,
    utilization: dto.utilization,
    churnRisk: dto.churnRisk,
  };
}

export function mapEstablishmentDetail(
  dto: AdminEstablishmentDetailDto
): EstablishmentDetailView {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    category: dto.category,
    status: dto.status,
    createdAt: formatDate(dto.createdAt),
    ownerName: dto.owner?.name ?? "—",
    ownerEmail: dto.owner?.email ?? "—",
    plan: dto.plan ?? "—",
    subscriptionStatus: dto.subscription?.status ?? "—",
    nextBilling: dto.subscription?.currentPeriodEnd
      ? formatDate(dto.subscription.currentPeriodEnd)
      : "—",
    mrr: dto.mrr,
    members: dto.members,
    professionals: dto.professionals,
    customers: dto.customers,
    appointmentsTotal: dto.appointments.total,
    appointmentsCompleted: dto.appointments.completed,
    appointmentsCanceled: dto.appointments.canceled,
    totalPaid: dto.revenue.totalPaid,
    failedPayments: dto.revenue.failedPayments,
    refunds: dto.revenue.refunds,
    utilization: dto.utilization,
    churnRisk: dto.churnRisk,
    lastAccess: dto.lastAccess ? formatDateTime(dto.lastAccess) : "—",
    recentActivity: dto.recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      at: formatDateTime(a.at),
    })),
  };
}
