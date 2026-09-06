export type Role =
  | "super_admin"
  | "finance"
  | "support"
  | "operations"
  | "product"
  | "read_only";

export type Permission =
  | "overview"
  | "establishments"
  | "establishment_detail"
  | "users"
  | "plans"
  | "subscriptions"
  | "payments"
  | "finance"
  | "customers"
  | "product_usage"
  | "acquisition"
  | "retention"
  | "churn"
  | "churn_risk"
  | "alerts"
  | "audit_logs"
  | "support"
  | "administrators"
  | "settings"
  | "impersonate"
  | "ambassadors";

export type AdminRole =
  | "Super Admin"
  | "Finance"
  | "Support"
  | "Operations"
  | "Product"
  | "Read Only";

export type EstablishmentStatus =
  | "active"
  | "trial"
  | "inactive"
  | "suspended"
  | "canceled";

export type ChurnRisk = "high" | "medium" | "low" | "unknown";

export type ActivityType =
  | "establishment"
  | "subscription"
  | "payment"
  | "admin"
  | "system";

export type ActivityStatus = "success" | "warning" | "danger" | "info";

export interface KPI {
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down" | "flat";
  context: string;
}

export interface MetricPoint {
  period: string;
  mrr: number;
  arr: number;
  users: number;
  activeBusinesses: number;
}

export interface SecondaryMetric {
  label: string;
  value: string;
  delta?: number;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  entity: string;
  at: string;
  status: ActivityStatus;
}

export interface PlanRow {
  id: string;
  name: string;
  subscribers: number;
  mrr: number;
  growth: number;
  churn: number;
  revenueShare: number;
}

export interface EstablishmentRow {
  id: string;
  name: string;
  owner: string;
  plan: string;
  status: EstablishmentStatus;
  mrr: number;
  createdAt: string;
  lastAccess: string;
  professionals: number;
  customers: number;
  utilization: number;
  churnRisk: ChurnRisk;
}

export interface EstablishmentDetail extends EstablishmentRow {
  ltv: number;
  nextBilling: string;
  activeDays: number;
  dau: number;
  wau: number;
  mau: number;
  totalPaid: number;
  failedPayments: number;
  refunds: number;
  riskScore: number;
  mrrAtRisk: number;
  riskReasons: string[];
  usage: {
    appointments: number;
    clients: number;
    professionals: number;
    services: number;
    products: number;
    campaigns: number;
    markaAiSessions: number;
    sessions: number;
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    activeDays: number;
    sessions: number;
  };
}

export interface UserRow {
  id: string;
  name: string;
  establishment: string;
  type: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  activity: string;
}

export interface AdminRow {
  id: string;
  name: string;
  role: AdminRole;
  status: string;
  lastLogin: string;
  recentActions: number;
}

export type SubscriptionStatus =
  | "active"
  | "trial"
  | "past_due"
  | "canceled"
  | "paused"
  | "upgraded"
  | "downgraded"
  | "expansion"
  | "contraction";

export interface SubscriptionRow {
  id: string;
  customer: string;
  establishment: string;
  plan: string;
  status: SubscriptionStatus;
  mrr: number;
  createdAt: string;
  nextBilling: string;
}

export type PaymentMethod = "PIX" | "card" | "boleto";

export interface PaymentRow {
  id: string;
  customer: string;
  establishment: string;
  value: number;
  method: PaymentMethod;
  status: "approved" | "pending" | "failed" | "refunded";
  date: string;
}

export interface FinanceMetric {
  label: string;
  value: string;
  delta?: number;
}

export interface ChurnRiskRow {
  id: string;
  establishment: string;
  plan: string;
  mrr: number;
  riskScore: number;
  lastLogin: string;
  utilization: number;
  utilizationDelta: number;
  reasons: string[];
}

export interface CustomerRow {
  id: string;
  name: string;
  total: number;
  status: string;
  bookings: number;
  ticket: number;
}

export type PermissionMap = Record<Permission, boolean>;

// ---------------------------------------------------------------------------
// Indique e Ganhe (ambassador program)
// ---------------------------------------------------------------------------

export type AmbassadorStatus = "ACTIVE" | "PAUSED" | "SUSPENDED" | "REMOVED";
export type ReferralStatus = "PENDING" | "SIGNED_UP" | "UNDER_REVIEW" | "ACTIVE" | "CANCELED";
export type CommissionStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELED";
export type WithdrawalStatus = "PENDING" | "PROCESSING" | "PAID" | "REJECTED";
export type CommissionModel = "ONE_TIME" | "RECURRING" | "HYBRID";
export type CommissionValueType = "PERCENT" | "FIXED";

export interface AmbassadorOverview {
  activeAmbassadors: number;
  totalReferrals: number;
  newCustomers: number;
  conversionRate: number;
  commissionsGenerated: number;
  commissionsPending: number;
  commissionsPaid: number;
  series: Array<{
    date: string;
    referrals: number;
    conversions: number;
    revenue: number;
    commissions: number;
  }>;
}

export interface AmbassadorRow {
  id: string;
  establishmentId: string;
  establishmentName: string;
  code: string;
  status: AmbassadorStatus;
  createdAt: string;
  referrals: number;
  conversions: number;
  activeCustomers: number;
  commissionGenerated: number;
  availableBalance: number;
}

export interface AmbassadorDetail extends AmbassadorRow {
  link: string;
  revenueGenerated: number;
  referralHistory: Array<{
    id: string;
    establishmentName: string | null;
    status: ReferralStatus;
    createdAt: string;
    convertedAt: string | null;
  }>;
  financialHistory: Array<{
    id: string;
    kind: "commission" | "withdrawal";
    label: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

export interface AdminReferralRow {
  id: string;
  ambassadorName: string;
  establishmentName: string | null;
  status: ReferralStatus;
  createdAt: string;
  convertedAt: string | null;
}

export interface AdminCommissionRow {
  id: string;
  ambassadorName: string;
  referralEstablishment: string | null;
  kind: "BONUS" | "RECURRING";
  amount: number;
  status: CommissionStatus;
  createdAt: string;
}

export interface AdminWithdrawalRow {
  id: string;
  ambassadorName: string;
  amount: number;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt: string | null;
}

export interface AmbassadorProgramSettingsDto {
  active: boolean;
  commissionModel: CommissionModel;
  commissionType: CommissionValueType;
  bonusAmount: number | null;
  recurringPercent: number | null;
  recurringFixed: number | null;
  minWithdrawalAmount: number;
  approvalPeriodDays: number;
  cancellationRules: string | null;
}
