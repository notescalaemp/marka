import type {
  ActivityStatus,
  ActivityType,
  ChurnRisk,
  EstablishmentStatus,
} from "./types";

/** Raw DTOs from /api/admin/* — mirror backend responses exactly. */

export interface AdminOverviewKpisDto {
  mrr: number;
  arr: number;
  activeBusinesses: number;
  churn: number;
  delta: { mrr: number; arr: number };
}

export interface AdminOverviewSeriesPointDto {
  period: string;
  mrr: number;
  arr: number;
  users: number;
}

export interface AdminOverviewSecondaryDto {
  netNewMrr: number;
  mrrAtRisk: number;
  trialToPaid: number;
}

export interface AdminOverviewActivityDto {
  id: string;
  type: string;
  description: string;
  entity: string;
  at: string;
  status: string;
}

export interface AdminOverviewPlanDto {
  id: string;
  name: string;
  subscribers: number;
  mrr: number;
  growth: number;
}

export interface AdminOverviewDto {
  kpis: AdminOverviewKpisDto;
  series: AdminOverviewSeriesPointDto[];
  /** Backend returns a one-element array with the secondary metrics object. */
  secondary: AdminOverviewSecondaryDto[];
  activity: AdminOverviewActivityDto[];
  plans: AdminOverviewPlanDto[];
}

export interface AdminEstablishmentOwnerDto {
  id: string;
  name: string;
  email: string;
}

export interface AdminEstablishmentListItemDto {
  id: string;
  name: string;
  owner: AdminEstablishmentOwnerDto;
  plan: string | null;
  status: string;
  mrr: number;
  createdAt: string;
  lastAccess: string | null;
  professionals: number;
  customers: number;
  utilization: number | null;
  churnRisk: string;
}

export interface AdminEstablishmentListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminEstablishmentDetailDto {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  createdAt: string;
  owner: AdminEstablishmentOwnerDto;
  plan: string | null;
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    canceledAt: string | null;
  } | null;
  mrr: number;
  members: number;
  professionals: number;
  customers: number;
  appointments: {
    total: number;
    completed: number;
    canceled: number;
  };
  revenue: {
    totalPaid: number;
    failedPayments: number;
    refunds: number;
  };
  utilization: number | null;
  recentActivity: Array<{
    id: string;
    action: string;
    actorType: string;
    targetType: string;
    at: string;
  }>;
  churnRisk: string;
  lastAccess: string | null;
}

/** UI models used by Overview / Establishments / Detail pages. */

export interface OverviewKpiView {
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down" | "flat";
  context: string;
}

export interface OverviewSecondaryView {
  label: string;
  value: string;
}

export interface OverviewActivityView {
  id: string;
  type: ActivityType | string;
  description: string;
  entity: string;
  at: string;
  status: ActivityStatus | string;
}

export interface OverviewPlanView {
  id: string;
  name: string;
  subscribers: number;
  mrr: number;
  growth: number;
}

export interface EstablishmentListItemView {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  status: EstablishmentStatus | string;
  mrr: number;
  createdAt: string;
  lastAccess: string;
  professionals: number;
  customers: number;
  utilization: number | null;
  churnRisk: ChurnRisk | string;
}

export interface EstablishmentDetailView {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: EstablishmentStatus | string;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  plan: string;
  subscriptionStatus: string;
  nextBilling: string;
  mrr: number;
  members: number;
  professionals: number;
  customers: number;
  appointmentsTotal: number;
  appointmentsCompleted: number;
  appointmentsCanceled: number;
  totalPaid: number;
  failedPayments: number;
  refunds: number;
  utilization: number | null;
  churnRisk: ChurnRisk | string;
  lastAccess: string;
  recentActivity: Array<{
    id: string;
    action: string;
    at: string;
  }>;
}
