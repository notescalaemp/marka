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

export interface AdminListMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminUsersKpisDto {
  total: number;
  active: number;
  dau: number;
  wau: number;
}

export interface AdminUserListItemDto {
  id: string;
  name: string;
  email: string;
  establishment: string | null;
  type: string;
  status: string;
  lastLogin: string | null;
  createdAt: string;
  activity: string;
}

export interface AdminUsersListDto {
  kpis: AdminUsersKpisDto;
  items: AdminUserListItemDto[];
}

export interface AdminPlanListItemDto {
  id: string;
  code: string;
  name: string;
  priceMonthly: number;
  active: boolean;
  subscribers: number;
  activeCount: number;
  trialCount: number;
  mrr: number;
  revenueShare: number;
  arpu: number;
  churn: number;
  upgradeRate: number;
  downgradeRate: number;
  trialToPaid: number;
  ltv: number | null;
}

export interface AdminPlanDetailDto {
  id: string;
  code: string;
  name: string;
  priceMonthly: number;
  active: boolean;
}

export interface AdminSubscriptionsKpisDto {
  active: number;
  trial: number;
  pastDue: number;
  expansionMrr: number;
}

export interface AdminSubscriptionListItemDto {
  id: string;
  customer: string;
  establishment: string;
  plan: string;
  status: string;
  mrr: number;
  createdAt: string;
  nextBilling: string;
}

export interface AdminSubscriptionsListDto {
  kpis: AdminSubscriptionsKpisDto;
  items: AdminSubscriptionListItemDto[];
}

export interface AdminPaymentsKpisDto {
  volume: number;
  approved: number;
  failed: number;
  failureRate: number;
}

export interface AdminPaymentListItemDto {
  id: string;
  customer: string;
  establishment: string;
  value: number;
  method: string;
  status: string;
  date: string;
}

export interface AdminPaymentsListDto {
  kpis: AdminPaymentsKpisDto;
  items: AdminPaymentListItemDto[];
}

export interface AdminFinanceMetricDto {
  label: string;
  value: string;
  delta?: number;
}

export interface AdminFinanceBreakdownDto {
  recurring: number;
  nonRecurring: number;
  delinquency: number;
  margin: number | null;
}

export interface AdminFinanceDto {
  metrics: AdminFinanceMetricDto[];
  breakdown: AdminFinanceBreakdownDto;
}

export interface AdminCustomersKpisDto {
  total: number;
  newThisMonth: number;
  bookings: number;
  bookingConversion: number | null;
}

export interface AdminCustomerListItemDto {
  id: string;
  name: string;
  establishment: string;
  status: string;
  total: number;
  bookings: number;
  ticket: number;
  repeat: number;
}

export interface AdminCustomersListDto {
  kpis: AdminCustomersKpisDto;
  items: AdminCustomerListItemDto[];
}

export interface AdminChurnRiskKpisDto {
  high: number;
  medium: number;
  customersAtRisk: number;
  mrrAtRisk: number;
}

export interface AdminChurnRiskListItemDto {
  id: string;
  establishment: string;
  plan: string;
  mrr: number;
  riskScore: number;
  lastLogin: string | null;
  utilization: number | null;
  utilizationDelta: number | null;
  reasons: string[];
}

export interface AdminChurnRiskListDto {
  kpis: AdminChurnRiskKpisDto;
  items: AdminChurnRiskListItemDto[];
}

export interface AdminAlertDto {
  id: string;
  severity: "critical" | "warning" | "info" | "opportunity";
  title: string;
  description: string;
  cta: string;
}

export interface AdminSupportKpisDto {
  open: number;
  highPriority: number;
  resolved: number;
  openOnly: number;
}

export interface AdminSupportTicketDto {
  id: string;
  subject: string;
  customer: string;
  establishment: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
}

export interface AdminSupportTicketsDto {
  kpis: AdminSupportKpisDto;
  items: AdminSupportTicketDto[];
}

export interface AdminAdministratorListItemDto {
  id: string;
  name: string;
  email?: string;
  role: string;
  status: string;
  lastLogin: string | null;
  recentActions: number;
}

export interface AdminAuditLogDto {
  id: string;
  at: string;
  admin: string;
  action: string;
  entity: string;
  result: string;
  ip: string;
}

export interface AdminAcquisitionFunnelStepDto {
  label: string;
  value: number;
}

export interface AdminAcquisitionChannelDto {
  label: string;
  value: number;
}

export interface AdminAcquisitionDto {
  leads: number;
  signups: number;
  trialToPaid: number;
  cac: number | null;
  funnel: AdminAcquisitionFunnelStepDto[];
  channels: AdminAcquisitionChannelDto[];
}

export interface AdminRetentionCohortDto {
  month: string;
  m1: number | null;
  m2: number | null;
  m3: number | null;
  m4: number | null;
  m5: number | null;
  m6: number | null;
}

export interface AdminProductUsageKpisDto {
  dau: number;
  wau: number;
  stickiness: number;
  sessionsPerUser: number;
}

export interface AdminProductUsageFeatureDto {
  feature: string;
  adoption: number;
  growth: number;
}

export interface AdminProductUsageDto {
  kpis: AdminProductUsageKpisDto;
  features: AdminProductUsageFeatureDto[];
}

export interface AdminChurnAnalyticsKpisDto {
  customerChurn: number;
  revenueChurn: number;
  grr: number | null;
  nrr: number | null;
}

export interface AdminChurnBreakdownItemDto {
  reason: string;
  share: number;
}

export interface AdminChurnAnalyticsDto {
  kpis: AdminChurnAnalyticsKpisDto;
  breakdown: AdminChurnBreakdownItemDto[];
  mrrAtRisk: number;
}

export interface AdminSettingsDto {
  brand: { name: string; locale: string };
  environment: string;
  apiUrl: string | null;
  cookieDomain: string | null;
  features: {
    impersonation: boolean;
    auditLogs: boolean;
    marketingCampaigns: boolean;
    onlinePayments: boolean;
  };
  note: string | null;
}

export interface AdminImpersonateResponseDto {
  establishmentId: string;
  establishmentName: string;
  userId: string;
  userName: string;
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
